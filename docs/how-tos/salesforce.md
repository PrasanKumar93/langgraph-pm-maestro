# How to get Salesforce keys

- SF_USERNAME, SF_PASSWORD, SF_LOGIN_URL, SF_SECURITY_TOKEN

## Account setup

- sign up at https://developer.salesforce.com/signup

```sh
SF_USERNAME="your login username"
SF_PASSWORD="your login password"
SF_LOGIN_URL="https://login.salesforce.com"
```

### Get SF_SECURITY_TOKEN

The Salesforce Security Token is required when logging in via username-password authentication.

- Click on your profile picture (top-right corner).
- Go to Settings → My Personal Information → Reset My Security Token.
- Click Reset Security Token, and Salesforce will send it to your registered email.
- Use this token in your .env file: `SF_SECURITY_TOKEN`=your_security_token
