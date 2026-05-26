import base64
import hashlib
import hmac
import secrets


PBKDF2_PREFIX = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 260_000


def hash_password(password):
    password = str(password or "")
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    salt_b64 = base64.b64encode(salt).decode("ascii")
    digest_b64 = base64.b64encode(digest).decode("ascii")
    return f"{PBKDF2_PREFIX}${PBKDF2_ITERATIONS}${salt_b64}${digest_b64}"


def generate_temporary_password():
    return secrets.token_urlsafe(12)


def is_password_hash(value):
    return str(value or "").startswith(f"{PBKDF2_PREFIX}$")


def verify_password(password, stored_value):
    stored = str(stored_value or "")
    password = str(password or "")

    if not is_password_hash(stored):
        return hmac.compare_digest(stored, password)

    try:
        _, iterations, salt_b64, digest_b64 = stored.split("$", 3)
        salt = base64.b64decode(salt_b64.encode("ascii"))
        expected = base64.b64decode(digest_b64.encode("ascii"))
        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            int(iterations),
        )
    except Exception:
        return False

    return hmac.compare_digest(actual, expected)
