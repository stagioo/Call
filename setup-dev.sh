#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
  echo -e "${BLUE}==>${NC} $1"
}

print_success() {
  echo -e "${GREEN}==>${NC} $1"
}

print_error() {
  echo -e "${RED}==>${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}==>${NC} $1"
}

# Function to detect OS and install build essentials
install_build_essentials() {
  print_step "Checking for build essentials..."
  
  # Check if make is available
  if ! command -v make &> /dev/null; then
    print_warning "make is not installed. Installing build essentials..."
    
    # Detect OS and install appropriate build tools
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      if command -v brew &> /dev/null; then
        print_step "Installing build essentials via Homebrew..."
        brew install make gcc python3
        print_success "Build essentials installed via Homebrew"
      else
        print_error "Homebrew is not installed. Please install Homebrew first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        echo "Then run: brew install make gcc python3"
        exit 1
      fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      # Linux
      if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        print_step "Installing build essentials via apt..."
        sudo apt-get update
        sudo apt-get install -y build-essential python3
        print_success "Build essentials installed via apt"
      elif command -v yum &> /dev/null; then
        # CentOS/RHEL/Fedora
        print_step "Installing build essentials via yum..."
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y python3
        print_success "Build essentials installed via yum"
      elif command -v dnf &> /dev/null; then
        # Fedora (newer versions)
        print_step "Installing build essentials via dnf..."
        sudo dnf groupinstall -y "Development Tools"
        sudo dnf install -y python3
        print_success "Build essentials installed via dnf"
      else
        print_error "Could not detect package manager. Please install build-essential and python3 manually."
        exit 1
      fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]] || [[ -n "$WINDIR" ]]; then
      # Windows
      print_step "Detected Windows system..."
      
      # Check if we're in WSL
      if grep -q Microsoft /proc/version 2>/dev/null; then
        print_step "Detected WSL (Windows Subsystem for Linux)..."
        if command -v apt-get &> /dev/null; then
          print_step "Installing build essentials via apt in WSL..."
          sudo apt-get update
          sudo apt-get install -y build-essential python3
          print_success "Build essentials installed via apt in WSL"
        else
          print_error "WSL detected but apt-get not available. Please install build-essential and python3 manually."
          exit 1
        fi
      else
        # Native Windows (Git Bash, MSYS2, etc.)
        print_warning "Native Windows detected. For mediasoup compilation, you need:"
        echo "  1. Visual Studio Build Tools or Visual Studio Community"
        echo "  2. Python 3.x"
        echo "  3. Node.js with npm/pnpm"
        echo ""
        echo "Please install these manually:"
        echo "  - Visual Studio Build Tools: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022"
        echo "  - Python: https://www.python.org/downloads/"
        echo ""
        echo "After installation, run this script again."
        exit 1
      fi
    else
      print_error "Unsupported OS: $OSTYPE. Please install build essentials manually."
      exit 1
    fi
  else
    print_success "Build essentials are already installed"
  fi
}

# Function to compile mediasoup worker
compile_mediasoup_worker() {
  print_step "Checking for mediasoup worker compilation..."
  
  local worker_dir="apps/server/node_modules/mediasoup/worker"
  
  if [ ! -d "$worker_dir" ]; then
    print_warning "mediasoup worker directory not found. Skipping compilation."
    return 0
  fi
  
  # Check if worker binary already exists
  if [ -f "$worker_dir/out/Release/mediasoup-worker" ] || [ -f "$worker_dir/out/Release/mediasoup-worker.exe" ]; then
    print_success "mediasoup worker binary already exists"
    return 0
  fi
  
  print_step "Compiling mediasoup worker..."
  cd "$worker_dir"
  
  if make; then
    print_success "mediasoup worker compiled successfully"
  else
    print_error "Failed to compile mediasoup worker"
    print_warning "You may need to install additional dependencies or check the error above"
    return 1
  fi
  
  cd - > /dev/null
}

if [ ! -f .env ]; then
  print_step "Creating .env file from .env.example..."
  if [ -f .env.example ]; then
    cp .env.example .env
    print_success "Created .env file. Please update it with your configuration."
  else

    print_step "Creating default .env file..."
    cat >.env <<EOL
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/call

# App Configuration
NODE_ENV=development
EOL
    print_success "Created default .env file"
  fi
fi

if ! docker info >/dev/null 2>&1; then
  print_error "Docker is not running. Please start Docker first."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  print_step "Installing dependencies..."
  pnpm install
  print_success "Dependencies installed"
fi

# Install build essentials and compile mediasoup worker
install_build_essentials
compile_mediasoup_worker

print_step "Starting Docker services..."
docker compose up -d
if [ $? -eq 0 ]; then
  print_success "Docker services started successfully"
else
  print_error "Failed to start Docker services"
  exit 1
fi

print_step "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    print_success "PostgreSQL is ready"
    print_step "Migrating db..."
    pnpm run db:migrate
    break
  fi
  if [ $i -eq 30 ]; then
    print_error "PostgreSQL failed to start within 30 seconds"
    exit 1
  fi
  sleep 1
done

print_step "Starting development environment..."
if [ "$1" = "--filter" ] && [ -n "$2" ]; then
  print_step "Starting development for $2..."
  pnpm dev --filter $2
else
  pnpm dev
fi
