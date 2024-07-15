import { Context } from '@actions/github/lib/context'

import * as im from '@actions/exec/lib/interfaces'
import ProcessEnv = NodeJS.ProcessEnv

export type ExecFn = (commandLine: string, args?: string[], options?: im.ExecOptions) => Promise<number>

function getServiceName(repo: string) {
    return repo.startsWith('peachjar-') ?
        repo.slice('peachjar-'.length) : repo
}

function getDefaultImage(repo: string, serviceName: string) {
    return `docker.pkg.github.com/peachjar/${repo}/${serviceName}`
}

export default async function run(
    exec: ExecFn,
    context: Context,
    core: {
        getInput: (key: string, opts?: { required: boolean }) => string,
        info: (...args: any[]) => void,
        debug: (...args: any[]) => void,
        setFailed: (message: string) => void,
        [k: string]: any,
    },
    env: ProcessEnv
): Promise<any> {
    try {
        core.info('Deploying service to environment.')

        const awsAccessKeyId = core.getInput('awsAccessKeyId', { required: true })
        const awsSecretAccessKey = core.getInput('awsSecretAccessKey', { required: true })

        if (!awsAccessKeyId || !awsSecretAccessKey) {
            return core.setFailed('AWS credentials are invalid.')
        }

        const environment = core.getInput('environment', { required: true })

        if (!environment) {
            return core.setFailed('Environment not specified or invalid.')
        }

        const repository = context.repo.repo
        const serviceName = getServiceName(repository)
        const gitsha = context.sha.slice(0, 7)

        const timeout = core.getInput('timeout') || '600'
        const pullSecret = core.getInput('imagePullSecret') || 'peachjar-eks-github-pull-secret'
        const helmChartPath = core.getInput('helmChartPath') || `./${serviceName}`
        const helmReleaseName = core.getInput('helmReleaseName') || serviceName
        const dockerImage = core.getInput('dockerImage') || getDefaultImage(repository, serviceName)
        const dockerTag = core.getInput('dockerTag') || `git-${gitsha}`

        const extraVars: string[] = [
            core.getInput('setString1'),
            core.getInput('setString2'),
            core.getInput('setString3'),
            core.getInput('setString4'),
            core.getInput('setString5'),
        ]
        .filter(Boolean)
        .reduce((acc, kvp) => acc.concat('--set-string', kvp.trim()), [] as string[])

        core.info('Starting deploy...')
            await exec('helm', [
                '--kubeconfig',
                `../kilauea/kubefiles/${environment}/kubeconfig-github-actions/${environment}-kube-config-admins.yml`,
                'upgrade', helmReleaseName, helmChartPath, '-f', `${helmChartPath}/values-${environment}.yaml`,
                '--set-string', `image.tag=${dockerTag}`,
                '--set-string', `gitsha="${gitsha}"`,
                '--set-string', `image.registryAndName=${dockerImage}`,
                '--set-string', `image.pullSecret=${pullSecret}`,
                ...extraVars,
                '--wait', '--timeout', `${timeout}s`
            ], {
                cwd: 'peachjar-aloha/',
                env: Object.assign({}, env, {
                    AWS_ACCESS_KEY_ID: awsAccessKeyId,
                    AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
                }),
            })

        core.info('Deployment complete.')

    } catch (error) {

        core.setFailed(error.message)
    }
}
