#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# This function is now mostly for informational purposes or for other build essentials if needed by pnpm install
install_build_essentials() {
  print_step "Checking for general build essentials (for pnpm install if needed)..."

  # We're primarily relying on pre-built mediasoup-worker,
  # but some 'pnpm install' steps might still require Python or a C++ compiler.
  # This part of the script can remain, but it's less critical for mediasoup-worker specifically.

  if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v brew &> /dev/null; then
      print_warning "Homebrew is not installed. Please install Homebrew first for general build tools:"
      echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
      echo "Then run: brew install make gcc python3"
      # Do not exit here, allow to proceed and download mediasoup worker
    else
      print_success "Homebrew is installed."
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! command -v build-essential &> /dev/null && ! command -v "Development Tools" &> /dev/null; then
      print_warning "build-essential or Development Tools are not fully installed. This might be needed for some npm/pnpm packages."
    fi
    print_success "Linux build environment detected."
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]] || [[ -n "$WINDIR" ]]; then
    print_step "Detected Windows system. Visual C++ Redistributable might be needed for mediasoup-worker."
    # We will prompt for this specifically later if the worker fails
  fi
  print_success "General build essential check completed."
}


download_mediasoup_worker() {
  local mediasoup_version=$(node -p "require('./apps/server/node_modules/mediasoup/package.json').version")
  # Remove 'v' prefix if present from mediasoup_version for URL construction
  local clean_version=${mediasoup_version#v}

  local worker_dir="apps/server/node_modules/mediasoup/worker"
  local release_dir="$worker_dir/out/Release"
  local worker_binary_name="mediasoup-worker"
  local download_url=""
  local arch=$(uname -m)

  print_step "Detected mediasoup version: ${mediasoup_version}"
  print_step "Using version for download URL: ${clean_version}" # Added for debugging

  mkdir -p "$release_dir"

  if [[ "$OSTYPE" == "darwin"* ]]; then
    worker_binary_name="mediasoup-worker" # No .exe extension on macOS
    if [[ "$arch" == "x86_64" ]]; then
      download_url="https://github.com/versatica/mediasoup/releases/download/${clean_version}/mediasoup-worker-${clean_version}-darwin-x64.tgz"
    elif [[ "$arch" == "arm64" ]]; then # M1/M2 Macs
      download_url="https://github.com/versatica/mediasoup/releases/download/${clean_version}/mediasoup-worker-${clean_version}-darwin-arm64.tgz"
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    worker_binary_name="mediasoup-worker"
    if [[ "$arch" == "x86_64" ]]; then
      download_url="https://github.com/versatica/mediasoup/releases/download/${clean_version}/mediasoup-worker-${clean_version}-linux-x64.tgz"
    elif [[ "$arch" == "aarch64" ]]; then
      download_url="https://github.com/versatica/mediasoup/releases/download/${clean_version}/mediasoup-worker-${clean_version}-linux-arm64.tgz"
    fi
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]] || [[ -n "$WINDIR" ]]; then
    worker_binary_name="mediasoup-worker.exe"
    if [[ "$arch" == "x86_64" ]]; then
      download_url="https://github.com/versatica/mediasoup/releases/download/${clean_version}/mediasoup-worker-${clean_version}-win32-x64.tgz"
    else
      print_error "Unsupported Windows architecture: $arch. Only x64 is supported for pre-built binaries."
      exit 1
    fi
  else
    print_error "Unsupported OS for pre-built mediasoup worker download: $OSTYPE"
    exit 1
  fi

  if [ -f "$release_dir/$worker_binary_name" ]; then
    print_success "Correct mediasoup worker binary ($worker_binary_name) already exists for version ${mediasoup_version}"
    export MEDIASOUP_WORKER_BIN="$(pwd)/$release_dir/$worker_binary_name" # Set for later use
    return 0
  fi

  if [ -z "$download_url" ]; then
    print_error "Could not determine download URL for mediasoup-worker on your system."
    exit 1
  fi

  print_step "Downloading mediasoup worker binary from: $download_url"
  if ! curl -L "$download_url" -o "$worker_dir/worker.tgz"; then
    print_error "Failed to download mediasoup worker binary."
    exit 1
  fi

  print_step "Extracting mediasoup worker binary..."
  # Create a temporary directory for extraction to handle various archive structures
  local temp_extract_dir="$release_dir/temp_extract"
  mkdir -p "$temp_extract_dir"

  # Extract without --strip-components to preserve full path structure
  tar -xzf "$worker_dir/worker.tgz" -C "$temp_extract_dir"
  if [ $? -ne 0 ]; then
    print_error "Failed to extract mediasoup worker binary. Please check the downloaded file ($worker_dir/worker.tgz) and ensure you have \`tar\` installed."
    rm -rf "$temp_extract_dir" # Clean up temp dir on failure
    exit 1
  fi

  # Find the actual binary within the extracted contents
  local found_binary=""
  if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]] || [[ -n "$WINDIR" ]]; then
    # For Windows, look for mediasoup-worker.exe
    found_binary=$(find "$temp_extract_dir" -name "mediasoup-worker.exe" -print -quit)
  else
    # For Linux/macOS, look for mediasoup-worker
    found_binary=$(find "$temp_extract_dir" -name "mediasoup-worker" -print -quit)
  fi

  if [ -n "$found_binary" ]; then
    print_step "Found binary at: $found_binary"
    mv "$found_binary" "$release_dir/$worker_binary_name"
    print_success "mediasoup worker binary downloaded and extracted successfully to $release_dir/$worker_binary_name"
    export MEDIASOUP_WORKER_BIN="$(pwd)/$release_dir/$worker_binary_name" # Set for later use
  else
    print_error "mediasoup worker binary not found after extraction. Please check the contents of $worker_dir/worker.tgz or the extracted contents in $temp_extract_dir"
    exit 1
  fi

  rm -rf "$temp_extract_dir" # Clean up the temporary extraction directory
  rm "$worker_dir/worker.tgz" # Clean up the tarball
}


# The previous compile_mediasoup_worker function is now replaced by download_mediasoup_worker
# as the primary means to get the worker binary.
# The original logic about "make" is removed since we're using pre-builts.


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

if ! docker compose version &> /dev/null; then
  print_error "'docker compose' not found. Install Docker Compose plugin:"
  echo "  https://docs.docker.com/compose/install/linux/"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  print_step "Installing dependencies with pnpm..."
  pnpm install
  if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
  else
    print_error "Failed to install dependencies with pnpm."
    exit 1
  fi
fi

# We don't need to run install_build_essentials here if our primary goal is to use pre-built worker.
# However, if other pnpm packages require build tools, it can be called before pnpm install.
# For mediasoup worker, we directly download.

download_mediasoup_worker

# Crucial: Export MEDIASOUP_WORKER_BIN so Node.js process picks it up
# This is handled within download_mediasoup_worker now.

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
    if [ $? -eq 0 ]; then
      print_success "Database migrations applied successfully"
    else
      print_error "Failed to apply database migrations."
      exit 1
    fi
    break
  fi
  if [ $i -eq 30 ]; then
    print_error "PostgreSQL failed to start within 30 seconds"
    exit 1
  fi
  sleep 1
done

# Check for Visual C++ Redistributable on Windows
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]] || [[ -n "$WINDIR" ]]; then
  print_step "Checking for Microsoft Visual C++ Redistributable 2022 (essential for mediasoup worker on Windows)..."
  print_warning "It is crucial to install the 'Microsoft Visual C++ Redistributable for Visual Studio 2022' for the mediasoup-worker to function correctly."
  echo -e "${YELLOW}🔗 Download VC++ Redistributable x64: https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170${NC}"
  echo -e "${YELLOW}Please install it and then reboot your system if you encounter any issues with the mediasoup-worker.${NC}"
  print_success "Visual C++ Redistributable installation advisory completed."
fi


print_success "Setup completed successfully! 🎉"
echo ""
echo -e "${GREEN}Next steps to get started:${NC}"
echo "1. Update your .env file with your configuration (if you haven't already)"
echo "2. Start the development server:"
echo "   - For all apps: pnpm dev"
echo "   - For specific app: pnpm dev --filter <app-name>"
echo ""
echo -e "${BLUE}Available apps:${NC}"
echo "   - apps/web (Next.js frontend)"
echo "   - apps/server (Express.js backend)"
echo ""
echo -e "${YELLOW}Note:${NC} The database is ready and migrations have been applied."
echo "Docker services are running in the background."
echo "The mediasoup worker binary for your system has been prepared."