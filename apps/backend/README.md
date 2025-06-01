## Setting Up PostgreSQL with Docker Compose

### Prerequisites

- Install **Docker** and **Docker Compose** on your machine.
  - Install Docker from [here](https://docs.docker.com/get-docker/).
  - Docker Compose typically comes bundled with Docker.

### Steps to Set Up PostgreSQL with Docker Compose

1. **Clone or Download the Repository**

   Make sure you have the repository containing the `docker-compose.yml` file.

2. **Create a `.env` File**

   In the project root directory, create a `.env` file and add the following variables:

   ```plaintext
   POSTGRES_USER=your_user_name
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=your_database_name
   POSTGRES_PORT=5432
   POSTGRES_HOST=localhost
   ```

3. **Start PostgreSQL using docker compose**

   ```bash
   docker-compose up -d
   ```

4. **Verify the PostgreSQL Container is Running**

   ```bash
       docker ps
   ```

5. **Stop PostgreSQL**

   ```bash
   docker-compose down
   ```

6. **Connecting to PostgreSQL**

   ```plaintext
   postgres://your_username:your_password@localhost:5432/your_database_name
   ```

7. **If any issue with docker compose, check the logs**
   ```bash
   docker-compose logs
   ```
