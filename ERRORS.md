# Setup Script Error Guide

This document outlines common errors that may occur when running `setup-dev.sh` and how to resolve them.

## Prerequisites Errors

### 1. Missing Build Essentials

**Error:** `make is not installed` or `Could not detect package manager`

**Solutions:**

- **macOS:** Install Homebrew first, then run `brew install make gcc python3`
- **Ubuntu/Debian:** `sudo apt-get update && sudo apt-get install -y build-essential python3`
- **CentOS/RHEL:** `sudo yum groupinstall -y "Development Tools" && sudo yum install -y python3`
- **Fedora:** `sudo dnf groupinstall -y "Development Tools" && sudo dnf install -y python3`
- **Windows:** [Microsoft Visual C++ Redistributable for Visual Studio 2022](https://aka.ms/vs/17/release/vc_redist.x64.exe) and Python 3.x manually

### 2. Missing Docker Compose

**Error:** `'docker compose' not found`

**Solution:** Install Docker Compose plugin

- **Linux:** Follow https://docs.docker.com/compose/install/linux/
- **macOS:** Install via Docker Desktop or `brew install docker-compose`
- **Windows:** Install via Docker Desktop

### 3. Missing pnpm

**Error:** `pnpm: command not found`

**Solution:** Install pnpm

```bash
npm install -g pnpm
# or
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

## Installation Errors

### 4. pnpm install fails

**Error:** `pnpm install` fails with various errors

**Solutions:**

- Clear cache: `pnpm store prune`
- Delete node_modules: `rm -rf node_modules && pnpm install`
- Check Node.js version: Ensure you're using Node.js 18+ or 20+
- Update pnpm: `npm install -g pnpm@latest`

### 5. mediasoup worker compilation fails

**Error:** `Failed to compile mediasoup worker`

**Solutions:**

- Ensure build essentials are installed (see error #1)
- On Windows, ensure Visual Studio Build Tools are installed
- Try manual compilation:
  ```bash
  cd apps/server/node_modules/mediasoup/worker
  make clean && make
  ```
- Check for specific compilation errors in the output

## Docker Errors

### 6. Docker service fails to start

**Error:** `Failed to start Docker services`

**Solutions:**

- Ensure Docker is running: `sudo systemctl start docker`
- Check Docker Compose file syntax: `docker compose config`
- Check available ports (PostgreSQL uses 5434)
- Check Docker logs: `docker compose logs`

### 7. PostgreSQL connection timeout

**Error:** `PostgreSQL failed to start within 30 seconds`

**Solutions:**

- Check if port 5434 is available: `netstat -tulpn | grep 5434`
- Check Docker container status: `docker compose ps`
- Check PostgreSQL logs: `docker compose logs postgres`
- Increase timeout by modifying the script or restart Docker services

### 8. Database migration fails

**Error:** `pnpm run db:migrate` fails

**Solutions:**

- Ensure PostgreSQL is running: `docker compose ps`
- Check database connection: `docker compose exec postgres psql -U postgres -d call`
- Reset database: `docker compose down -v && docker compose up -d`
- Check migration files in `packages/db/drizzle/`

## Environment Errors

### 9. Missing .env file

**Error:** Script creates default .env but configuration is incomplete

**Solution:** Update the generated .env file with your specific configuration:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/call

# App Configuration
NODE_ENV=development

# Add other required environment variables
```

### 10. Permission denied errors

**Error:** `Permission denied` when running sudo commands

**Solutions:**

- Ensure you have sudo privileges
- On macOS, you might need to grant Terminal full disk access
- On Linux, ensure your user is in the docker group: `sudo usermod -aG docker $USER`

## Network and Port Errors

### 11. Port already in use

**Error:** Docker services fail to start due to port conflicts

**Solutions:**

- Check what's using the port: `lsof -i :5434`
- Stop conflicting services
- Modify docker-compose.yml to use different ports
- Kill processes using the port: `sudo kill -9 <PID>`

### 12. Network connectivity issues

**Error:** Cannot pull Docker images or access external resources

**Solutions:**

- Check internet connection
- Configure Docker proxy if behind corporate firewall
- Use VPN if required
- Check DNS resolution

## OS-Specific Errors

### 13. WSL-specific issues

**Error:** Various WSL-related errors

**Solutions:**

- Update WSL: `wsl --update`
- Ensure WSL2 is enabled
- Check Windows Defender Firewall settings
- Restart WSL: `wsl --shutdown && wsl`

### 14. macOS-specific issues

**Error:** Homebrew or Xcode command line tools issues

**Solutions:**

- Install Xcode command line tools: `xcode-select --install`
- Update Homebrew: `brew update`
- Check Homebrew permissions: `sudo chown -R $(whoami) /usr/local/*`

## Troubleshooting Commands

### Useful debugging commands:

```bash
# Check Docker status
docker compose ps
docker compose logs

# Check PostgreSQL
docker compose exec postgres pg_isready -U postgres

# Check Node.js and pnpm versions
node --version
pnpm --version

# Check build tools
make --version
gcc --version

# Check ports
netstat -tulpn | grep 5434

# Reset everything
docker compose down -v
rm -rf node_modules
pnpm install
```

## Getting Help

If you encounter an error not covered here:

1. Check the script output for specific error messages
2. Run the script with verbose output: `bash -x setup-dev.sh`
3. Check the logs of individual components
4. Ensure all prerequisites are met
5. Try running each step manually to isolate the issue

<div align="center">
  <p>Made with ❤️ by the Call team</p>
  <p>
    <a href="https://joincall.co">Website</a> •
    <a href="https://github.com/Call0dotco/call">GitHub</a> •
    <a href="https://discord.com/invite/bre4echNxB">Discord</a> •
    <a href="https://x.com/joincalldotco">Twitter</a>
  </p>
</div>
