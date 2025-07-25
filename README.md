# Daas-TextVolt Backend

### Prerequisites
- Docker
- Node.js (for local development)

### Environment Variables

Create a `.env` file in the root directory with the content from env.example


# Server Configuration
PORT=3000

### Running the App

#### Local Development
1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a `.env` file with your configuration
3. Start the server:
   ```sh
   npm start
   ```

#### Docker
1. Build the Docker image:
   ```sh
   docker build -t daas-textvolt-backend .
   ```
2. Run the container with environment variables:
   ```sh
   docker run -p 3000:3000 --env-file .env daas-textvolt-backend
   ```

The app will be available at `http://localhost:3000`.
 