pipeline {
    agent {
        node {
            label 'git-websites'
        }
    }

    environment {
        GRADLE_OPTS    = '-Dci=true -Dfile.encoding=UTF-8'
        STAGING_BRANCH = 'asf-staging'
        SITE_DIR       = 'build/site'
        EXPORT_DIR     = "/tmp/tapestry-site-${env.BUILD_NUMBER}"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        // -- 01: Build the Antora site ----------------------------------------

        stage('Build Site') {
            tools {
                jdk 'jdk_21_latest'
            }
            steps {
                script {
                    env.SOURCE_SHA = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()
                }

                sh './gradlew --no-daemon antora'

                // Cheap sanity check to preventhalf-built site.
                //  - index.html: done by antora
                // - .htaccess: after antora
                sh """
                    test -f ${env.SITE_DIR}/index.html
                    test -f ${env.SITE_DIR}/.htaccess
                """

                // Move the output clear of the workspace as the next
                // step checks out a different branch
                sh """
                    rm -rf ${env.EXPORT_DIR}
                    cp -r ${env.SITE_DIR} ${env.EXPORT_DIR}
                """
            }
        }

        // -- 02: Publish to the staging branch --------------------------------

        stage('Stage') {
            when {
                branch 'main'
            }
            steps {
                // The multibranch checkout only fetches the built branch, so
                // fetch the staging ref explicitly before switching to it.
                sh """
                    git config user.name  'jenkins'
                    git config user.email 'jenkins@builds.apache.org'
                    git fetch --no-tags origin \
                        ${env.STAGING_BRANCH}:refs/remotes/origin/${env.STAGING_BRANCH}
                    git checkout -B ${env.STAGING_BRANCH} \
                        refs/remotes/origin/${env.STAGING_BRANCH}
                """

                // Drop stale output so deleted pages actually disappear.
                // .asf.yaml drives the staging deployment and must survive.
                sh '''
                    find . -mindepth 1 -maxdepth 1 \\
                        ! -name '.git' \\
                        ! -name '.asf.yaml' \\
                        -exec rm -rf {} +
                '''

                // Another cheap check
                sh """
                    cp -r ${env.EXPORT_DIR}/. .
                    test -f index.html
                    test -f .asf.yaml
                """

                sh """
                    git add -A
                    git commit -m 'Staged site from ${env.BRANCH_NAME} (${env.SOURCE_SHA})' \
                        || echo 'No changes to stage'
                    git push origin ${env.STAGING_BRANCH}
                """
            }
        }
    }

    post {
        fixed   { sendMail('FIXED') }
        failure { sendMail('FAILURE') }
        aborted { sendMail('ABORTED') }

        cleanup {
            sh "rm -rf ${env.EXPORT_DIR} || true"
            deleteDir()
        }
    }
}

// MAIL NOTIFICATIONS

def getChangeLog() {
    def changeSets = currentBuild.changeSets
    if (changeSets.isEmpty()) {
        return "No changes recorded (manual build or no new commits)."
    }
    return changeSets
        .collectMany { it.items as List }
        .collect { "[${it.author}] ${it.msg}" }
        .join('\n')
}

def sendMail(buildStatus) {
    emailext (
        subject: "[${buildStatus}] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
        body: """
STATUS: ${buildStatus}
Build URL: ${env.BUILD_URL}
Duration: ${currentBuild.durationString.replace(' and counting', '')}
Staged at: https://tapestry.staged.apache.org/

-----------------------------------------------------------
CHANGES
-----------------------------------------------------------
${getChangeLog()}
        """,
        recipientProviders: [
            developers(), // People who have commits in this build
            requestor()   // The person who manually triggered the build
        ]
    )
}
