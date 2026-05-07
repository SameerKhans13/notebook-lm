FROM node:20-alpine

WORKDIR /app

# Install system dependencies for PDF processing
RUN apk add --no-cache python3 build-base cairo-dev jpeg-dev pango-dev giflib-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
