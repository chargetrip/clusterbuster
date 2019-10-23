FROM node:12



EXPOSE 8080

scp -R -i /Users/bartolkaruza/Desktop/ec2.pem ./* ubuntu@ec2-54-93-55-120.eu-central-1.compute.amazonaws.com:/home/ubuntu