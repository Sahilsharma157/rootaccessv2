pipeline {
    agent any
    
    environment {
        NODE_ENV = 'production'
        DOCKER_IMAGE = 'rootaccess:latest'
        DOCKER_CONTAINER = 'rootaccess'
        NEXT_PUBLIC_SUPABASE_URL = credentials('NEXT_PUBLIC_SUPABASE_URL')
        NEXT_PUBLIC_SUPABASE_ANON_KEY = credentials('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        SUPABASE_SERVICE_ROLE_KEY = credentials('SUPABASE_SERVICE_ROLE_KEY')
    }
    
    stages {
        stage('Stage 1: Dependencies') {
            steps {
                echo '===================='
                echo 'Stage 1: Installing Dependencies'
                echo '===================='
                bat 'npm install --include=dev --legacy-peer-deps'
                echo 'Dependencies installed successfully'
            }
        }
        
        stage('Stage 2: Build') {
            steps {
                echo '===================='
                echo 'Stage 2: Building Application'
                echo '===================='
                bat 'npm run build'
                echo 'Next.js build completed successfully'
            }
        }
        
        stage('Stage 3: Docker Build') {
            steps {
                echo '===================='
                echo 'Stage 3: Building Docker Image'
                echo '===================='
                bat 'docker build -t %DOCKER_IMAGE% .'
                echo 'Docker image built: %DOCKER_IMAGE%'
            }
        }
        
        stage('Stage 4: Deploy') {
            steps {
                echo '===================='
                echo 'Stage 4: Deploying Container'
                echo '===================='
                bat '''
                    docker stop %DOCKER_CONTAINER% 2>nul || exit /b 0
                    docker rm %DOCKER_CONTAINER% 2>nul || exit /b 0
                    docker run -d -p 3000:3000 ^
                      -e NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL% ^
                      -e NEXT_PUBLIC_SUPABASE_ANON_KEY=%NEXT_PUBLIC_SUPABASE_ANON_KEY% ^
                      -e SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_SERVICE_ROLE_KEY% ^
                      --name %DOCKER_CONTAINER% %DOCKER_IMAGE%
                '''
                echo 'Application deployed successfully'
                echo 'App accessible at http://localhost:3000'
            }
        }
    }
    
    post {
        success {
            echo '================================'
            echo 'Pipeline Execution Successful'
            echo '================================'
        }
        failure {
            echo '================================'
            echo 'Pipeline Execution Failed'
            echo '================================'
        }
    }
}

