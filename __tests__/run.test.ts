import { Context } from '@actions/github/lib/context'

import run, { ExecFn } from '../src/run'

describe('Run function', () => {

    let context: Context
    let core: {
        getInput: (key: string, opts?: { required: boolean }) => string
        debug: (...args: any[]) => void
        info: (...args: any[]) => void
        setFailed: (message: string) => void
        [k: string]: any
    }
    let exec: ExecFn

    const awsAccessKeyId = 'abcd1234'
    const awsSecretAccessKey = 'adfasdfasfasfasdfasdfasdfasdfasdf'
    const environment = 'kauai'

    beforeEach(() => {
        exec = jest.fn(() => Promise.resolve(0))
        context = ({
            sha: 'fa1e24f762a20c3ca1da807f4787e5b21e2de499',
            repo: { owner: 'peachjar', repo: 'peachjar-svc-foobar' }
        } as any) as Context
        core = {
            getInput: jest.fn((key: string) => {
                switch (key) {
                    case 'awsAccessKeyId': return awsAccessKeyId
                    case 'awsSecretAccessKey': return awsSecretAccessKey
                    case 'environment': return environment
                    default: return ''
                }
            }),
            debug: jest.fn(),
            info: jest.fn(),
            setFailed: jest.fn()
        }
    })

    describe('when only the mandatory inputs are supplied', () => {
        it('should use repository default values', async () => {
            await run(exec, context, core, { FOO: 'bar' })
            expect(exec).toHaveBeenCalledWith('helm', [
                '--kubeconfig',
                `../kilauea/kubefiles/kauai/kubectl_configs/kauai-kube-config-admins.yml`,
                'upgrade', 'svc-foobar', './svc-foobar',
                '--set-string', `image.tag=git-fa1e24f`,
                '--set-string', `gitsha="fa1e24f"`,
                '--set-string', `image.registryAndName=docker.pkg.github.com/peachjar/peachjar-svc-foobar/svc-foobar`,
                '--set-string', `image.pullSecret=peachjar-eks-github-pull-secret`,
                '--wait', '--timeout', '600',
            ], {
                cwd: 'peachjar-aloha/',
                env: {
                    FOO: 'bar',
                    AWS_ACCESS_KEY_ID: awsAccessKeyId,
                    AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
                },
            })
            expect(core.setFailed).not.toHaveBeenCalled()
        })
    })

    describe('when the awsAccessKeyId is invalid', () => {
        beforeEach(() => {
            core.getInput = jest.fn((key: string) => {
                switch (key) {
                    case 'awsAccessKeyId': return ''
                    case 'awsSecretAccessKey': return awsSecretAccessKey
                    case 'environment': return environment
                    default: return ''
                }
            })
        })

        it('should fail the action', async () => {
            await run(exec, context, core, { FOO: 'bar' })
            expect(core.setFailed).toHaveBeenCalled()
        })
    })

    describe('when the awsSecretAccessKey is invalid', () => {
        beforeEach(() => {
            core.getInput = jest.fn((key: string) => {
                switch (key) {
                    case 'awsAccessKeyId': return awsAccessKeyId
                    case 'awsSecretAccessKey': return ''
                    case 'environment': return environment
                    default: return ''
                }
            })
        })

        it('should fail the action', async () => {
            await run(exec, context, core, { FOO: 'bar' })
            expect(core.setFailed).toHaveBeenCalled()
        })
    })

    describe('when the environment is invalid', () => {
        beforeEach(() => {
            core.getInput = jest.fn((key: string) => {
                switch (key) {
                    case 'awsAccessKeyId': return awsAccessKeyId
                    case 'awsSecretAccessKey': return awsSecretAccessKey
                    case 'environment': return ''
                    default: return ''
                }
            })
        })

        it('should fail the action', async () => {
            await run(exec, context, core, { FOO: 'bar' })
            expect(core.setFailed).toHaveBeenCalled()
        })
    })

    describe('when the defaults are overridden', () => {
        beforeEach(() => {
            core.getInput = jest.fn((key: string) => {
                switch (key) {
                    case 'awsAccessKeyId': return awsAccessKeyId
                    case 'awsSecretAccessKey': return awsSecretAccessKey
                    case 'environment': return environment
                    case 'timeout': return '900'
                    case 'imagePullSecret': return 'dockerhub-secret'
                    case 'helmChartPath': return './helm/foobaz'
                    case 'helmReleaseName': return 'circus'
                    case 'dockerImage': return 'peachjar/foobaz'
                    case 'dockerTag': return 'v1.2.3'
                    default: return ''
                }
            })
        })

        it('should use the supplied inputs', async () => {
            await run(exec, context, core, { FOO: 'bar' })
            expect(exec).toHaveBeenCalledWith('helm', [
                '--kubeconfig',
                `../kilauea/kubefiles/kauai/kubectl_configs/kauai-kube-config-admins.yml`,
                'upgrade', 'circus', './helm/foobaz',
                '--set-string', `image.tag=v1.2.3`,
                '--set-string', `gitsha="fa1e24f"`,
                '--set-string', `image.registryAndName=peachjar/foobaz`,
                '--set-string', `image.pullSecret=dockerhub-secret`,
                '--wait', '--timeout', '900',
            ], {
                cwd: 'peachjar-aloha/',
                env: {
                    FOO: 'bar',
                    AWS_ACCESS_KEY_ID: awsAccessKeyId,
                    AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
                },
            })
            expect(core.setFailed).not.toHaveBeenCalled()
        })
    })

    describe('when setString options are supplied', () => {
        beforeEach(() => {
            core.getInput = jest.fn((key: string) => {
                switch (key) {
                    case 'awsAccessKeyId': return awsAccessKeyId
                    case 'awsSecretAccessKey': return awsSecretAccessKey
                    case 'environment': return environment
                    case 'setString1': return 'foo=baz'
                    case 'setString2': return 'jo=mama'
                    case 'setString4': return 'hello="world"'
                    case 'setString5': return '  wow=spaces  '
                    default: return ''
                }
            })
        })

        it('should add valid --set-string options to the Helm command', async () => {
            await run(exec, context, core, { FOO: 'bar' })
            expect(exec).toHaveBeenCalledWith('helm', [
                '--kubeconfig',
                `../kilauea/kubefiles/kauai/kubectl_configs/kauai-kube-config-admins.yml`,
                'upgrade', 'svc-foobar', './svc-foobar',
                '--set-string', `image.tag=git-fa1e24f`,
                '--set-string', `gitsha="fa1e24f"`,
                '--set-string', `image.registryAndName=docker.pkg.github.com/peachjar/peachjar-svc-foobar/svc-foobar`,
                '--set-string', `image.pullSecret=peachjar-eks-github-pull-secret`,
                '--set-string', 'foo=baz',
                '--set-string', 'jo=mama',
                '--set-string', 'hello="world"',
                '--set-string', 'wow=spaces',
                '--wait', '--timeout', '600',
            ], {
                cwd: 'peachjar-aloha/',
                env: {
                    FOO: 'bar',
                    AWS_ACCESS_KEY_ID: awsAccessKeyId,
                    AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
                },
            })
            expect(core.setFailed).not.toHaveBeenCalled()
        })
    })

    describe('when exec throws an error', () => {

        const error = new Error('Kaboom!')

        beforeEach(() => {
            exec = jest.fn(() => Promise.reject(error))
        })

        it('should fail the action', async () => {
            await run(exec, context, core, { FOO: 'bar' })
            expect(core.setFailed).toHaveBeenCalledWith(error.message)
        })
    })
})
