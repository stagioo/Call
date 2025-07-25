#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_step() {
  echo -e "${BLUE}==>${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

if [ ! -f "package.json" ]; then
  print_error "Please run this script from the project root directory"
  exit 1
fi

print_step "Running post-pull setup..."


print_step "Installing dependencies..."
pnpm install
if [ $? -eq 0 ]; then
  print_success "Dependencies installed"
else
  print_error "Failed to install dependencies"
  exit 1
fi

print_step "Running database migrations..."
pnpm run db:migrate
if [ $? -eq 0 ]; then
  print_success "Database migrations completed"
else
  print_error "Database migrations failed"
  exit 1
fi

print_step "Generating database types..."
pnpm run db:generate
if [ $? -eq 0 ]; then
  print_success "Database types generated"
else
  print_error "Failed to generate database types"
  exit 1
fi


print_step "Pushing database changes..."
pnpm run db:push
if [ $? -eq 0 ]; then
  print_success "Database changes pushed"
else
  print_error "Failed to push database changes"
  exit 1
fi

print_success "Post-pull setup completed!"
