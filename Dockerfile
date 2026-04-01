# Build stage
FROM node:20-alpine as build
WORKDIR /app

# Copy package files from the subfolder
COPY "Tally Voice Assistant + Brand DNA/package*.json" ./

# Install dependencies
RUN npm install

# Copy all files from the subfolder to /app
COPY "Tally Voice Assistant + Brand DNA/" ./

# Build the project
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy the built assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
