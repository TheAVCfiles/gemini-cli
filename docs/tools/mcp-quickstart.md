# MCP Quickstart with Toolbox and MCP Inspector

This quickstart walks you through connecting the Gemini CLI to a Model Context Protocol (MCP) server that exposes PostgreSQL tools via the [Toolbox](https://github.com/google-gemini/toolbox) runtime. You will:

1. Set up a PostgreSQL database that contains hotel data.
2. Configure Toolbox so it can expose SQL tools over MCP.
3. Inspect and exercise those tools with MCP Inspector.

## Prerequisites

- A local PostgreSQL instance running and accessible on `127.0.0.1:5432`.
- `psql` available in your shell so you can connect to the database.
- Network access to download the Toolbox binary.
- `npx` (via Node.js) for launching MCP Inspector.

## Step 1: Create and seed the database

1. Connect to PostgreSQL as the default superuser:

   ```bash
   psql -h 127.0.0.1 -U postgres
   ```

2. Create a dedicated user and database for Toolbox:

   ```sql
   CREATE USER toolbox_user WITH PASSWORD 'my-password';

   CREATE DATABASE toolbox_db;
   GRANT ALL PRIVILEGES ON DATABASE toolbox_db TO toolbox_user;

   ALTER DATABASE toolbox_db OWNER TO toolbox_user;
   ```

3. Exit the `psql` session with `\q`.

4. Connect to the new database by using the Toolbox credentials:

   ```bash
   psql -h 127.0.0.1 -U toolbox_user -d toolbox_db
   ```

5. Create the `hotels` table:

   ```sql
   CREATE TABLE hotels(
     id            INTEGER NOT NULL PRIMARY KEY,
     name          VARCHAR NOT NULL,
     location      VARCHAR NOT NULL,
     price_tier    VARCHAR NOT NULL,
     checkin_date  DATE    NOT NULL,
     checkout_date DATE    NOT NULL,
     booked        BIT     NOT NULL
   );
   ```

6. Populate the table with sample data:

   ```sql
   INSERT INTO hotels(id, name, location, price_tier, checkin_date, checkout_date, booked)
   VALUES
     (1, 'Hilton Basel', 'Basel', 'Luxury', '2024-04-22', '2024-04-20', B'0'),
     (2, 'Marriott Zurich', 'Zurich', 'Upscale', '2024-04-14', '2024-04-21', B'0'),
     (3, 'Hyatt Regency Basel', 'Basel', 'Upper Upscale', '2024-04-02', '2024-04-20', B'0'),
     (4, 'Radisson Blu Lucerne', 'Lucerne', 'Midscale', '2024-04-24', '2024-04-05', B'0'),
     (5, 'Best Western Bern', 'Bern', 'Upper Midscale', '2024-04-23', '2024-04-01', B'0'),
     (6, 'InterContinental Geneva', 'Geneva', 'Luxury', '2024-04-23', '2024-04-28', B'0'),
     (7, 'Sheraton Zurich', 'Zurich', 'Upper Upscale', '2024-04-27', '2024-04-02', B'0'),
     (8, 'Holiday Inn Basel', 'Basel', 'Upper Midscale', '2024-04-24', '2024-04-09', B'0'),
     (9, 'Courtyard Zurich', 'Zurich', 'Upscale', '2024-04-03', '2024-04-13', B'0'),
     (10, 'Comfort Inn Bern', 'Bern', 'Midscale', '2024-04-04', '2024-04-16', B'0');
   ```

7. Exit `psql` with `\q`.

## Step 2: Install and configure Toolbox

1. Download the Toolbox binary that matches your operating system and architecture:

   ```bash
   export OS="linux/amd64" # Supported values: linux/amd64, darwin/arm64, darwin/amd64, windows/amd64
   curl -O https://storage.googleapis.com/genai-toolbox/v0.16.0/$OS/toolbox
   ```

2. Make the binary executable:

   ```bash
   chmod +x toolbox
   ```

3. Create a `tools.yaml` configuration file with your database credentials:

   ```yaml
   sources:
     my-pg-source:
       kind: postgres
       host: 127.0.0.1
       port: 5432
       database: toolbox_db
       user: toolbox_user
       password: my-password
   tools:
     search-hotels-by-name:
       kind: postgres-sql
       source: my-pg-source
       description: Search for hotels based on name.
       parameters:
         - name: name
           type: string
           description: The name of the hotel.
       statement: SELECT * FROM hotels WHERE name ILIKE '%' || $1 || '%';
     search-hotels-by-location:
       kind: postgres-sql
       source: my-pg-source
       description: Search for hotels based on location.
       parameters:
         - name: location
           type: string
           description: The location of the hotel.
       statement: SELECT * FROM hotels WHERE location ILIKE '%' || $1 || '%';
     book-hotel:
       kind: postgres-sql
       source: my-pg-source
       description: >-
          Book a hotel by its ID. If the hotel is successfully booked, returns a NULL, raises an error if not.
       parameters:
         - name: hotel_id
           type: string
           description: The ID of the hotel to book.
       statement: UPDATE hotels SET booked = B'1' WHERE id = $1;
     update-hotel:
       kind: postgres-sql
       source: my-pg-source
       description: >-
         Update a hotel's check-in and check-out dates by its ID. Returns a message
         indicating  whether the hotel was successfully updated or not.
       parameters:
         - name: hotel_id
           type: string
           description: The ID of the hotel to update.
         - name: checkin_date
           type: string
           description: The new check-in date of the hotel.
         - name: checkout_date
           type: string
           description: The new check-out date of the hotel.
       statement: >-
         UPDATE hotels SET checkin_date = CAST($2 as date), checkout_date = CAST($3
         as date) WHERE id = $1;
     cancel-hotel:
       kind: postgres-sql
       source: my-pg-source
       description: Cancel a hotel by its ID.
       parameters:
         - name: hotel_id
           type: string
           description: The ID of the hotel to cancel.
       statement: UPDATE hotels SET booked = B'0' WHERE id = $1;
   toolsets:
     my-toolset:
       - search-hotels-by-name
       - search-hotels-by-location
       - book-hotel
       - update-hotel
       - cancel-hotel
   ```

   > **Tip:** Replace hard-coded secrets with environment variable references (for example, `${PG_PASSWORD}`) when you move beyond local testing.

4. Start the Toolbox server and point it at the configuration file:

   ```bash
   ./toolbox --tools-file "tools.yaml"
   ```

## Step 3: Inspect the tools with MCP Inspector

1. Launch MCP Inspector in a separate terminal:

   ```bash
   npx @modelcontextprotocol/inspector
   ```

   When prompted, enter `y` to install the package if it has not been downloaded previously.

2. Copy the session token that MCP Inspector prints to the console. You will need it to authenticate the proxy connection.

3. Open the Inspector URL shown in the terminal. In the web UI:

   - Set **Transport Type** to **Streamable HTTP**.
   - Use `http://127.0.0.1:5000/mcp` for the **URL**.
   - Paste the session token into **Configuration → Proxy Session Token**.
   - Click **Connect**.

4. Choose **List Tools** to verify that the SQL utilities from `tools.yaml` are available. You can then try each tool to confirm the database is reachable.

With Toolbox running and MCP Inspector connected, you can now configure the Gemini CLI to use the same MCP endpoint or experiment further with custom SQL tools.
