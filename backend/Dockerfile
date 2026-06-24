FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the backend code
COPY . .

# Expose backend port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
