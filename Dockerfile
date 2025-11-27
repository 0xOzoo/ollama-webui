FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy application files
COPY . .

# Expose ports
EXPOSE 8080
EXPOSE 8081

# Start the application
CMD ["npm", "start"]
