#!/usr/bin/env python3
"""
License Key Generator for Notes Service

This script generates license keys for the Notes Service application.
Each key is tied to a specific server ID and contains owner information and expiry date.

Usage:
    python3 license_generator.py --server-id <SERVER_ID> --owner-name "<OWNER_NAME>" --days <DAYS>

Example:
    python3 license_generator.py --server-id "ABC123DEF456" --owner-name "John Doe" --days 365
"""

import argparse
import hashlib
import hmac
import json
import base64
from datetime import datetime, timedelta
from typing import Dict, Tuple
import secrets


# Secret key for signing (should be the same on server side for verification)
# In production, this should be stored securely and not in the script
SECRET_KEY = b"notes-service-license-secret-key-change-in-production"


def generate_license_key(
    server_id: str, owner_name: str, days: int
) -> Tuple[str, Dict]:
    """
    Generate a license key for a given server ID.

    Args:
        server_id: Unique server identifier (from License page)
        owner_name: Name of the license owner
        days: Number of days the license is valid

    Returns:
        Tuple of (license_key, license_info)
    """

    # Calculate expiry date
    expiry_date = datetime.utcnow() + timedelta(days=days)
    expiry_timestamp = int(expiry_date.timestamp())

    # Create license data
    license_data = {
        "server_id": server_id,
        "owner_name": owner_name,
        "expires_at": expiry_timestamp,
        "generated_at": int(datetime.utcnow().timestamp()),
        "days": days,
    }

    # Create JSON representation
    license_json = json.dumps(license_data, separators=(",", ":"), sort_keys=True)

    # Generate signature
    signature = hmac.new(
        SECRET_KEY, license_json.encode(), hashlib.sha256
    ).digest()

    # Combine data and signature
    key_data = license_json.encode() + b"|" + signature

    # Encode as base64 for readability
    license_key = base64.b64encode(key_data).decode().replace("+", "-").replace("/", "_")

    # Make it more readable by adding hyphens
    license_key_formatted = "-".join(
        [license_key[i : i + 4] for i in range(0, len(license_key), 4)]
    )

    return license_key_formatted, {
        "server_id": server_id,
        "owner_name": owner_name,
        "expires_at": expiry_date.isoformat() + "Z",
        "days": days,
        "key": license_key_formatted,
    }


def verify_license_key(license_key: str) -> Tuple[bool, Dict]:
    """
    Verify a license key and extract its data.

    Args:
        license_key: The license key to verify

    Returns:
        Tuple of (is_valid, license_data)
    """

    try:
        # Remove hyphens
        key_clean = license_key.replace("-", "")

        # Decode from base64
        key_data = base64.b64decode(key_clean)

        # Split data and signature
        parts = key_data.split(b"|")
        if len(parts) != 2:
            return False, {"error": "Invalid key format"}

        license_json, signature = parts

        # Verify signature
        expected_signature = hmac.new(
            SECRET_KEY, license_json, hashlib.sha256
        ).digest()

        if not hmac.compare_digest(signature, expected_signature):
            return False, {"error": "Invalid signature"}

        # Parse license data
        license_data = json.loads(license_json)

        # Check expiry
        expiry_timestamp = license_data.get("expires_at", 0)
        if expiry_timestamp < int(datetime.utcnow().timestamp()):
            return False, {"error": "License has expired"}

        return True, license_data

    except Exception as e:
        return False, {"error": str(e)}


def main():
    parser = argparse.ArgumentParser(
        description="Generate license keys for Notes Service"
    )
    parser.add_argument(
        "--server-id",
        required=True,
        help="Unique server ID (from License page)",
    )
    parser.add_argument(
        "--owner-name",
        required=True,
        help="Name of the license owner",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=365,
        help="Number of days the license is valid (default: 365)",
    )
    parser.add_argument(
        "--verify",
        help="Verify an existing license key",
    )

    args = parser.parse_args()

    if args.verify:
        # Verify mode
        is_valid, data = verify_license_key(args.verify)
        if is_valid:
            print("✓ License key is valid")
            print(f"  Server ID: {data.get('server_id')}")
            print(f"  Owner: {data.get('owner_name')}")
            print(f"  Expires: {datetime.fromtimestamp(data.get('expires_at')).isoformat()}")
            print(f"  Days: {data.get('days')}")
        else:
            print("✗ License key is invalid")
            print(f"  Error: {data.get('error')}")
    else:
        # Generate mode
        license_key, info = generate_license_key(
            args.server_id, args.owner_name, args.days
        )

        print("=" * 60)
        print("LICENSE KEY GENERATED")
        print("=" * 60)
        print()
        print("Server ID:  ", info["server_id"])
        print("Owner Name: ", info["owner_name"])
        print("Valid Days: ", info["days"])
        print("Expires At: ", info["expires_at"])
        print()
        print("LICENSE KEY:")
        print("-" * 60)
        print(license_key)
        print("-" * 60)
        print()
        print("Instructions:")
        print("1. Send this license key to the client")
        print("2. Client enters the key on the License page")
        print("3. License will be activated automatically")
        print()


if __name__ == "__main__":
    main()
