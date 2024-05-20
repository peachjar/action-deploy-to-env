<p align="center">
  <a href="https://github.com/peachjar/action-deploy-to-env/actions"><img alt="typescript-action status" src="https://github.com/peachjar/action-deploy-to-env/workflows/build-test/badge.svg"></a>
</p>

# Github Action: Deploy to Environment

Deploy a Service to one of Peachjar's environments.  If you are not Peachjar, this will be no help to you!

## Usage

Normal usage is to supply AWS credentials and the environment you want to deploy to.  The action will automatically determine the Helm release, chart, and image, etc.

```
uses: peachjar/action-deploy-to-env@v1
with:
    awsAccessKeyId: ${{ secrets.AWS_ACCESS_KEY_ID }}
    awsSecretAccessKey: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    environment: kauai
```

Generally, you will not need to do this, but you can override various other parameters:

```
uses: peachjar/action-deploy-to-env@v1
with:
    awsAccessKeyId: ${{ secrets.AWS_ACCESS_KEY_ID }}
    awsSecretAccessKey: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    environment: kauai
    timeout: 900
    helmChartPath: echo-server/
    helmReleaseName: echo-server
    dockerImage: hashicorp/http-echo
    dockerTag: latest
```

You can optionally use `setString[1-5]` to specify additional parameters on the Helm chart:

```
uses: peachjar/action-deploy-to-env@v1
with:
    awsAccessKeyId: ${{ secrets.AWS_ACCESS_KEY_ID }}
    awsSecretAccessKey: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    environment: kauai
    setString1: foo=bar
    setString2: baz=foz
    setString3: yomama=${{ secrets.YO_MAMA }}
    setString4: tier=backend
    setString5: sha=${{ github.sha }}
```
### action-deploy-to-env@v4 changes
The new version of the action includes a previous step to run a migration from helm2 to helm 3 previous to execute the helm upgrade. 