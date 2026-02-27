# Inventory Import Feature Guide

## Overview

The inventory import feature allows you to bulk import products into your StockConnect inventory using CSV or JSON files.

## How to Use

### Step 1: Access the Import Feature

1. Navigate to the **Inventory** page in the admin dashboard
2. Click the green **Import** button in the top-right corner
3. The import modal will open

### Step 2: Prepare Your Data

#### Required Fields

- `name` - Product name (required)
- `price` - Product price in Naira (required)
- `quantity` - Stock quantity (required)

#### Optional Fields

- `category` - Product category (default: "Uncategorized")
- `reorderThreshold` - Minimum stock level before reorder alert (default: 5)
- `supplier` - Supplier name
- `description` - Product description
- `imageUrl` - URL to product image

### Step 3: Choose Your File Format

#### CSV Format

Download the template from the import modal or use this format:

```csv
name,category,price,quantity,reorderThreshold,supplier,description
iPhone 14 Pro,Electronics,450000,25,5,Apple Store,Latest iPhone model
Samsung Galaxy S23,Electronics,380000,30,5,Samsung Store,Flagship Android smartphone
```

**CSV Header Variations Supported:**

- `name`, `product name`, or `product`
- `quantity`, `stock`, or `qty`
- `reorderThreshold`, `reorder_threshold`, or `min_stock`
- `imageUrl`, `image_url`, or `image`

#### JSON Format

```json
[
  {
    "name": "iPhone 14 Pro",
    "category": "Electronics",
    "price": 450000,
    "quantity": 25,
    "reorderThreshold": 5,
    "supplier": "Apple Store",
    "description": "Latest iPhone model with advanced features"
  },
  {
    "name": "Samsung Galaxy S23",
    "category": "Electronics",
    "price": 380000,
    "quantity": 30,
    "reorderThreshold": 5,
    "supplier": "Samsung Store",
    "description": "Flagship Android smartphone"
  }
]
```

### Step 4: Upload and Import

1. Click **"Select File"** and choose your CSV or JSON file
2. Review the file name to confirm selection
3. Click **"Import Products"** button
4. Wait for the import process to complete

### Step 5: Review Results

After import completes, you'll see:

- ✅ **Success count** - Number of products successfully imported
- ❌ **Failed count** - Number of products that failed to import
- **Error details** - Specific errors for failed imports with row numbers

## Sample Files

Two sample files are included in the project root:

- `sample_inventory_import.csv` - CSV format example
- `sample_inventory_import.json` - JSON format example

## Features

### ✨ Smart CSV Parsing

- Automatically handles common header name variations
- Flexible column ordering
- Trims whitespace from values

### 🔒 Validation

- Validates required fields before import
- Provides detailed error messages for failed rows
- Transaction-based import (all-or-nothing per product)

### 📊 Import Results

- Real-time progress indicator
- Detailed success/failure statistics
- Error log with row numbers for easy debugging

### 📥 Template Download

- One-click CSV template download
- Pre-formatted with correct headers
- Includes sample data

## Error Handling

### Common Errors and Solutions

**"Missing required fields (name, price, quantity)"**

- Ensure all required fields are present in your file
- Check for empty cells in required columns

**"Failed to import products"**

- Verify file format (CSV or JSON)
- Check for syntax errors in JSON files
- Ensure CSV has proper comma separation

**"Unsupported file format"**

- Only .csv and .json files are supported
- Check file extension

## Tips for Successful Import

1. **Start Small**: Test with a few products first
2. **Use Template**: Download and modify the provided template
3. **Check Data**: Verify prices and quantities are numeric
4. **Review Errors**: If some products fail, check the error log for specific issues
5. **Backup**: Keep a copy of your import file for reference

## API Endpoint

The import feature uses the following API endpoint:

```
POST /api/products/bulk-import
Content-Type: application/json

Body:
{
  "products": [
    {
      "name": "Product Name",
      "price": 1000,
      "quantity": 50,
      "category": "Category",
      "reorderThreshold": 10,
      "supplier": "Supplier Name",
      "description": "Product description"
    }
  ]
}

Response:
{
  "success": 10,
  "failed": 2,
  "errors": [
    {
      "row": 5,
      "error": "Missing required fields",
      "data": {...}
    }
  ]
}
```

## Technical Details

### Frontend Implementation

- File: `src/pages/admin/Inventory.tsx`
- CSV parsing with header variation support
- JSON parsing with array/object handling
- Real-time import status updates

### Backend Implementation

- File: `src/routes/products.ts`
- Endpoint: `/api/products/bulk-import`
- Transaction-based bulk insert
- Per-product error handling
- Business ID association

## Support

For issues or questions about the import feature:

1. Check the error messages in the import results
2. Verify your file format matches the examples
3. Review the sample files provided
4. Ensure you're logged in with proper permissions
