"""Generate RSA key pairs for StagePort signing workflows."""

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def generate_keys(private_key_path: str = "private_key.pem", public_key_path: str = "public_key.pem") -> None:
    """Generate a private/public RSA key pair and write PEM files."""
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    with open(private_key_path, "wb") as private_file:
        private_file.write(private_pem)

    with open(public_key_path, "wb") as public_file:
        public_file.write(public_pem)

    print(f"Keys generated: {private_key_path}, {public_key_path}")


if __name__ == "__main__":
    generate_keys()
