
pipeline {
  agent any
    
  tools {nodejs "nodejs_14.17.6"}
    
  stages {
    stage('Build') {
      steps {
        sh 'docker build -t user-service .'
      }
    }
    stage('Deploy') {
      steps {
        sh 'cd /home/johols99 && docker-compose up -d user-service'
      }
    }
  }
}