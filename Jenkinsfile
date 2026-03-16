pipeline {
    agent any
    
    environment {
        NODE_ENV = 'production'
        DOCKER_IMAGE = 'rootaccess:latest'
        DOCKER_CONTAINER = 'rootaccess'
    }
    
    stages {
        stage('Stage 1: Dependencies') {
            steps {
                echo '===================='
                echo 'Stage 1: Installing Dependencies'
                echo '===================='
                sh 'npm install --legacy-peer-deps'
                echo '✅ Dependencies installed successfully'
            }
        }
        
        stage('Stage 2: Build') {
            steps {
                echo '===================='
                echo 'Stage 2: Building Application'
                echo '===================='
                sh 'npm run build'
                echo '✅ Next.js build completed successfully'
            }
        }
        
        stage('Stage 3: Docker Build') {
            steps {
                echo '===================='
                echo 'Stage 3: Building Docker Image'
                echo '===================='
                sh 'docker build -t ${DOCKER_IMAGE} .'
                echo '✅ Docker image built: ${DOCKER_IMAGE}'
            }
        }
        
        stage('Stage 4: Deploy') {
            steps {
                echo '===================='
                echo 'Stage 4: Deploying Container'
                echo '===================='
                sh '''
                    echo "Stopping old container..."
                    docker stop ${DOCKER_CONTAINER} || true
                    docker rm ${DOCKER_CONTAINER} || true
                    echo "Starting new container..."
                    docker run -d -p 3000:3000 --name ${DOCKER_CONTAINER} ${DOCKER_IMAGE}
                '''
                echo '✅ Application deployed successfully'
                echo '✅ App accessible at http://localhost:3000'
            }
        }
    }
    
    post {
        success {
            echo '================================'
            echo '✅ Pipeline Execution Successful'
            echo '================================'
        }
        failure {
            echo '================================'
            echo '❌ Pipeline Execution Failed'
            echo '================================'
        }
    }
}