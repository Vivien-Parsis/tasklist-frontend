// Jenkinsfile — pipeline CI/CD pour tasklist-frontend

pipeline {
  agent any

  tools {
    nodejs 'node24'
  }

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  environment {
    IMAGE_NAME = 'tasklist-frontend'
    DOCKERHUB = credentials('dockerhub-password')
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    // 1. Installation des dépendances
    stage('Install dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    // 2. Tests + couverture (lcov pour Sonar, JUnit pour Jenkins)
    stage('Tests') {
      steps {
        sh 'npm run test:coverage'
      }
      post {
        always {
          junit testResults: 'reports/junit.xml', allowEmptyResults: true
        }
      }
    }

    // 3 + 4. Analyse SonarQube + Quality Gate (bloquante via qualitygate.wait)
    stage('SonarQube analysis & Quality Gate') {
      environment {
        SCANNER_HOME = tool 'SonarScanner'
      }
      steps {
        withSonarQubeEnv('SonarQube-front') {
          sh "${SCANNER_HOME}/bin/sonar-scanner -Dsonar.projectVersion=${BUILD_NUMBER} -Dsonar.qualitygate.wait=true"
        }
      }
    }

    // 5. Construction de l'image Docker (Nginx servant le build statique)
    stage('Build Docker image') {
      steps {
        sh '''
          docker build \
            -t $DOCKERHUB_USR/$IMAGE_NAME:$BUILD_NUMBER \
            -t $DOCKERHUB_USR/$IMAGE_NAME:latest \
            .
        '''
      }
    }

    // 6. Scan de sécurité Trivy + rapports (non bloquant ici)
    stage('Trivy scan (reports)') {
      steps {
        sh '''
          mkdir -p security
          trivy image --no-progress --exit-code 0 \
            --format json  --output security/trivy-report.json \
            $DOCKERHUB_USR/$IMAGE_NAME:$BUILD_NUMBER
          trivy image --no-progress --exit-code 0 \
            --format table --output security/trivy-report.txt \
            $DOCKERHUB_USR/$IMAGE_NAME:$BUILD_NUMBER
        '''
      }
    }

    // 7. Génération d'une SBOM (CycloneDX)
    stage('Generate SBOM') {
      steps {
        sh '''
          mkdir -p security
          trivy image --no-progress \
                    --format spdx-json \
                    --output security/sbom-spdx.json \
            $DOCKERHUB_USR/$IMAGE_NAME:$BUILD_NUMBER
        '''
      }
    }

    // 8. Gate de sécurité : bloque sur HIGH/CRITICAL
    stage('Vulnerability gate (Trivy)') {
      steps {
        sh '''
          trivy image --no-progress --exit-code 1 \
            --severity HIGH,CRITICAL \
            $DOCKERHUB_USR/$IMAGE_NAME:$BUILD_NUMBER
        '''
      }
    }

    // 9. Publication de l'image sur Docker Hub
    stage('Push Docker image') {
      steps {
        sh '''
          echo "$DOCKERHUB_PSW" | docker login -u "$DOCKERHUB_USR" --password-stdin
          docker push $DOCKERHUB_USR/$IMAGE_NAME:$BUILD_NUMBER
          docker push $DOCKERHUB_USR/$IMAGE_NAME:latest
          docker logout
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'security/*', allowEmptyArchive: true, fingerprint: true
      cleanWs()
    }
  }
}