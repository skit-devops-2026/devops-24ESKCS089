pipeline {
    agent any

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Hygiene Checks') {
            steps {
                echo 'Running repository hygiene checks...'
                sh 'bash scripts/hygiene.sh'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing server and client dependencies...'
                sh 'make install'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running automated test suite...'
                sh 'make test'
            }
        }

        stage('Build') {
            steps {
                echo 'Building production bundle...'
                sh 'make build'
            }
        }
    }

    post {
        always {
            echo 'Build completed.'
        }
        success {
            echo 'Jenkins pipeline succeeded!'
        }
        failure {
            echo 'Jenkins pipeline failed.'
        }
    }
}
