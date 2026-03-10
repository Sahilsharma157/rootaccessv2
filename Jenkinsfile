pipeline {
    agent any
    
    stages {
        stage('Stage 1: Dependencies') {
            steps {
                echo '===================='
                echo 'Stage 1: Installing Dependencies'
                echo '===================='
                echo '✅ Stage 1 Complete'
            }
        }
        
        stage('Stage 2: Build') {
            steps {
                echo '===================='
                echo 'Stage 2: Building Application'
                echo '===================='
                echo '✅ Stage 2 Complete'
            }
        }
        
        stage('Stage 3: Docker') {
            steps {
                echo '===================='
                echo 'Stage 3: Building Docker Image'
                echo '===================='
                echo '✅ Stage 3 Complete'
            }
        }
        
        stage('Stage 4: Deploy') {
            steps {
                echo '===================='
                echo 'Stage 4: Ready for Deployment'
                echo '===================='
                echo '✅ All Stages Complete!'
                echo '===================='
            }
        }
    }
}