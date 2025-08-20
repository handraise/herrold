# Docker Deployment Guide for Herrold

## Overview
This guide explains how to deploy the Herrold test automation framework using Docker, both locally and on AWS EC2.

## Local Development with Docker

### Quick Start
```bash
# Build and run with docker-compose
npm run docker:up

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

### Manual Docker Commands
```bash
# Build the image
npm run docker:build

# Run with .env file
npm run docker:run

# Or run with explicit environment variables
docker run -p 3005:3005 \
  -e HANDRAISE_URL=https://stage-app.handraise.com \
  -e HANDRAISE_USERNAME=your-email@example.com \
  -e HANDRAISE_PASSWORD=your-password \
  herrold:latest
```

## AWS EC2 Deployment

### 1. Launch EC2 Instance
- **AMI**: Amazon Linux 2023 or Ubuntu Server 22.04 LTS
- **Instance Type**: t3.medium (minimum) or t3.large (recommended)
- **Storage**: 20-30GB gp3 EBS volume
- **Security Group**: Open port 3005 (or use ALB)

### 2. Install Docker on EC2
```bash
# For Amazon Linux 2023
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# For Ubuntu
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo usermod -a -G docker ubuntu

# Log out and back in for group changes to take effect
```

### 3. Deploy Application
```bash
# Clone repository
git clone https://github.com/handraise/herrold.git
cd herrold

# Create .env file
cp .env.template .env
nano .env  # Edit with your configuration

# Build and run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 4. Production Optimizations

#### Use ECR for Image Storage
```bash
# Build and tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [your-ecr-uri]
docker build -t herrold:latest .
docker tag herrold:latest [your-ecr-uri]/herrold:latest
docker push [your-ecr-uri]/herrold:latest
```

#### SystemD Service (for auto-restart)
Create `/etc/systemd/system/herrold.service`:
```ini
[Unit]
Description=Herrold Test Automation
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/herrold
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=ec2-user

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable herrold
sudo systemctl start herrold
```

### 5. Environment Variables via AWS

#### Using Systems Manager Parameter Store
```bash
# Store sensitive values
aws ssm put-parameter --name "/herrold/handraise_password" --value "your-password" --type "SecureString"

# Retrieve in Docker run
HANDRAISE_PASSWORD=$(aws ssm get-parameter --name "/herrold/handraise_password" --with-decryption --query 'Parameter.Value' --output text)
```

#### Using Secrets Manager
```bash
# Create secret
aws secretsmanager create-secret --name herrold/env --secret-string file://.env

# Use in docker-compose with helper script
#!/bin/bash
aws secretsmanager get-secret-value --secret-id herrold/env --query SecretString --output text > .env
docker-compose up -d
```

## Container Resource Management

The docker-compose.yml includes resource limits:
- **CPU**: 2 cores limit, 1 core reserved
- **Memory**: 4GB limit, 2GB reserved

Adjust these based on your instance type and workload.

## Persistent Storage

Test artifacts are mounted as a volume:
```yaml
volumes:
  - ./test-artifacts:/app/test-artifacts
```

Consider using EFS for shared storage across multiple instances:
```bash
# Mount EFS
sudo mount -t nfs4 -o nfsvers=4.1 [efs-dns-name]:/ /mnt/efs
ln -s /mnt/efs/test-artifacts ./test-artifacts
```

## Monitoring

### CloudWatch Logs
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure to ship Docker logs
docker logs herrold-app 2>&1 | aws logs put-log-events ...
```

### Health Checks
The Dockerfile includes a health check endpoint:
```bash
curl http://localhost:3005/api/tests
```

Use this with ALB health checks or monitoring tools.

## Scaling Considerations

### Horizontal Scaling
- Use ECS or EKS for container orchestration
- Implement job queue (SQS) for test distribution
- Use shared storage (EFS) for artifacts

### Vertical Scaling
- Playwright tests are CPU and memory intensive
- Consider c5.xlarge or m5.xlarge for heavy workloads
- Monitor container metrics to determine optimal instance size

## Security Best Practices

1. **Never commit .env files**
2. **Use IAM roles** for AWS service access
3. **Enable VPC endpoints** for private communication
4. **Use ALB with SSL** instead of exposing port 3005
5. **Implement API authentication** for production use
6. **Rotate credentials regularly** using Secrets Manager

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs herrold

# Verify environment variables
docker-compose config

# Check resource usage
docker stats
```

### Playwright browser issues
```bash
# Exec into container
docker exec -it herrold-app bash

# Test browser launch
npx playwright test --headed

# Check dependencies
ldd /ms-playwright/chromium-*/chrome-linux/chrome | grep "not found"
```

### Permission issues
```bash
# Fix artifact directory permissions
docker exec herrold-app chown -R node:node /app/test-artifacts
```