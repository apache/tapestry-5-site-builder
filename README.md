# tapestry-5-site-builder.git

This repo contains the site configuration and the build logic.
The content itself lives in [tapestry-5-site.git](https://gitbox.apache.org/repos/asf/tapestry-5-site.git), one branch per version.

Leveraging the Gradle Antora Plugin, simply run `./gradlew antora` to have the site generated into `build/site`.

## Building

```sh
./gradlew antora
```

This fetches the content from gitbox, so it renders what is **pushed**, not what is in your local checkout.

### Previewing local changes

To render a sibling checkout of `tapestry-5-site` instead:

```sh
./gradlew antora -PlocalPlaybook
open build/site/index.html
```

This uses `antora-playbook-local.yml`, which expects `tapestry-5-site` next to this repo:

```text
code/
├── tapestry-5-site/
└── tapestry-5-site-builder/
```

Antora reads the **committed branches** of that checkout, never the working tree, so commit before building.
Editing a page and rebuilding shows no change until the edit is committed.

## Publishing

The site is built and staged by Jenkins, defined in the `Jenkinsfile`:

1. `./gradlew antora` generates the site, and `.htaccess` is copied into the output.
2. On the `main` branch only, the result is committed to the `asf-staging` branch and pushed.
3. ASF infrastructure serves that branch at <https://tapestry.staged.apache.org/>.

The `asf-staging` branch holds **generated output**, not source.
Jenkins wipes everything but `.git` and `.asf.yaml` on each run, so never merge into it or commit to it by hand.

### Triggering a build

The Jenkins job is at
<https://ci-builds.apache.org/job/Tapestry/job/tapestry-5-site-builder/>.

It builds on pushes to **this** repo only.
Pushing content to `tapestry-5-site` does **not** start a build, because that repo has no `Jenkinsfile`.

So after changing content, go to the job and use **Build Now** to publish it.
The same applies to a new version branch in the content repo.
