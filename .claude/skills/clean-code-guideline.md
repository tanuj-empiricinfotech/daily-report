# Clean Code Guidelines

## Overview

This document serves as a comprehensive guide for writing clean, maintainable, and extensible Rust code. It outlines principles and practices that ensure code quality, reusability, and long-term maintainability. When writing or reviewing code, follow these guidelines to create software that is easy to understand, modify, and extend. This file is used by LLMs to understand and enforce coding standards throughout the codebase.

---

## Core Principles

### 1. DRY (Don't Repeat Yourself)

**Principle**: Every piece of knowledge should have a single, unambiguous representation within a system.

**Practices**:

- Extract repeated logic into reusable functions, structs, or modules
- Use constants for repeated values
- Create shared utilities for common operations
- Avoid copy-pasting code blocks
- When you find yourself writing similar code more than twice, refactor it

**Example - Bad**:

```rust
// Repeated validation logic
if email.contains('@') && email.len() > 5 {
    // ...
}
if email.contains('@') && email.len() > 5 {
    // ...
}
```

**Example - Good**:

```rust
fn is_valid_email(email: &str) -> bool {
    email.contains('@') && email.len() > 5
}

if is_valid_email(email) {
    // ...
}
```

---

### 2. Code Reusability

**Principle**: Write code that can be used in multiple contexts without modification or with minimal adaptation.

**Practices**:

- Create generic, parameterized functions instead of specific ones
- Use composition over inheritance where appropriate
- Design functions to be pure (no side effects) when possible
- Create utility libraries for common operations
- Use dependency injection to make components reusable
- Design APIs that are flexible and configurable
- Never add emojis in code

**Example - Bad**:

```rust
fn calculate_user_total(user_id: &str) -> Result<f64, String> {
    let user = get_user(user_id)?;
    Ok(user.items.iter().map(|item| item.price).sum())
}
```

**Example - Good**:

```rust
trait Priced {
    fn price(&self) -> f64;
}

fn calculate_total<T: Priced>(items: &[T]) -> f64 {
    items.iter().map(|item| item.price()).sum()
}

fn calculate_user_total(user_id: &str) -> Result<f64, String> {
    let user = get_user(user_id)?;
    Ok(calculate_total(&user.items))
}
```

---

### 3. Abstract Functions and Abstractions

**Principle**: Create abstractions that hide implementation details and provide clear, simple interfaces.

**Practices**:

- Use traits to define contracts
- Create abstraction layers between different concerns
- Hide complex implementation behind simple function signatures
- Use dependency inversion - depend on abstractions (traits), not concretions
- Create factory functions/structs for object creation
- Use strategy pattern for interchangeable algorithms

**Example - Bad**:

```rust
async fn process_payment(amount: f64, card_number: &str, cvv: &str) -> Result<(), String> {
    // Direct implementation tied to specific payment processor
    let client = reqwest::Client::new();
    client
        .post("https://stripe.com/api/charge")
        .json(&serde_json::json!({
            "amount": amount,
            "card_number": card_number,
            "cvv": cvv
        }))
        .send()
        .await?;
    Ok(())
}
```

**Example - Good**:

```rust
#[derive(Debug, Clone)]
struct PaymentDetails {
    card_number: String,
    cvv: String,
}

#[derive(Debug)]
struct PaymentResult {
    transaction_id: String,
}

#[async_trait::async_trait]
trait PaymentProcessor {
    async fn process_payment(
        &self,
        amount: f64,
        details: &PaymentDetails,
    ) -> Result<PaymentResult, String>;
}

struct StripeProcessor {
    api_key: String,
}

#[async_trait::async_trait]
impl PaymentProcessor for StripeProcessor {
    async fn process_payment(
        &self,
        amount: f64,
        details: &PaymentDetails,
    ) -> Result<PaymentResult, String> {
        // Implementation
        Ok(PaymentResult {
            transaction_id: "tx_123".to_string(),
        })
    }
}

async fn process_payment(
    processor: &dyn PaymentProcessor,
    amount: f64,
    details: &PaymentDetails,
) -> Result<PaymentResult, String> {
    processor.process_payment(amount, details).await
}
```

---

### 4. Extensibility

**Principle**: Design code that can be easily extended with new features without modifying existing code.

**Practices**:

- Follow the Open/Closed Principle: open for extension, closed for modification
- Use plugin architectures and trait objects for extensibility
- Design with future requirements in mind (but don't over-engineer)
- Use configuration over hardcoding
- Create extension points through traits and callbacks
- Use composition and dependency injection
- Design APIs that can accommodate new parameters/options

**Example - Bad**:

```rust
fn send_notification(user: &User, notification_type: &str) -> Result<(), String> {
    match notification_type {
        "email" => send_email(&user.email)?,
        "sms" => send_sms(&user.phone)?,
        _ => return Err("Unknown notification type".to_string()),
    }
    // Adding new notification types requires modifying this function
    Ok(())
}
```

**Example - Good**:

```rust
struct User {
    email: String,
    phone: String,
}

#[async_trait::async_trait]
trait NotificationChannel {
    async fn send(&self, user: &User) -> Result<(), String>;
}

struct EmailChannel;

#[async_trait::async_trait]
impl NotificationChannel for EmailChannel {
    async fn send(&self, user: &User) -> Result<(), String> {
        // Implementation
        Ok(())
    }
}

struct SmsChannel;

#[async_trait::async_trait]
impl NotificationChannel for SmsChannel {
    async fn send(&self, user: &User) -> Result<(), String> {
        // Implementation
        Ok(())
    }
}

struct NotificationService {
    channels: Vec<Box<dyn NotificationChannel>>,
}

impl NotificationService {
    fn new(channels: Vec<Box<dyn NotificationChannel>>) -> Self {
        Self { channels }
    }

    async fn send(&self, user: &User) -> Result<(), String> {
        for channel in &self.channels {
            channel.send(user).await?;
        }
        Ok(())
    }
}
// New notification types can be added without modifying existing code
```

---

### 5. Avoid Magic Numbers and Strings

**Principle**: Use named constants instead of hardcoded values to improve readability and maintainability.

**Practices**:

- Extract all magic numbers into named constants
- Use enums for related constants
- Create configuration structs for settings
- Use constants for API endpoints, timeouts, limits, etc.
- Document why specific values are used

**Example - Bad**:

```rust
if user.age >= 18 {
    // What does 18 mean?
}

tokio::time::sleep(Duration::from_millis(3000)).await;
// What does 3000 mean?

if status == "active" {
    // What are the valid statuses?
}
```

**Example - Good**:

```rust
const MINIMUM_AGE_FOR_ADULTS: u8 = 18;
const SESSION_TIMEOUT_MS: u64 = 3000;

#[derive(Debug, PartialEq, Eq)]
enum UserStatus {
    Active,
    Inactive,
    Suspended,
}

if user.age >= MINIMUM_AGE_FOR_ADULTS {
    // Clear intent
}

tokio::time::sleep(Duration::from_millis(SESSION_TIMEOUT_MS)).await;
// Clear intent

if status == UserStatus::Active {
    // Type-safe and clear
}
```

---

## Additional Best Practices

### 6. Single Responsibility Principle

Each function, struct, or module should have one reason to change.

**Example**:

```rust
// Bad: Multiple responsibilities
struct User {
    id: String,
    name: String,
    email: String,
}

impl User {
    fn save(&self) -> Result<(), String> {
        /* database logic */
        Ok(())
    }
    
    fn send_email(&self) -> Result<(), String> {
        /* email logic */
        Ok(())
    }
    
    fn validate(&self) -> Result<(), String> {
        /* validation logic */
        Ok(())
    }
}

// Good: Single responsibility
struct User {
    id: String,
    name: String,
    email: String,
}

impl User {
    fn validate(&self) -> Result<(), String> {
        /* validation only */
        Ok(())
    }
}

struct UserRepository;

impl UserRepository {
    fn save(&self, user: &User) -> Result<(), String> {
        /* database logic */
        Ok(())
    }
}

struct EmailService;

impl EmailService {
    fn send_to_user(&self, user: &User) -> Result<(), String> {
        /* email logic */
        Ok(())
    }
}
```

### 7. Meaningful Names

- Use descriptive names that reveal intent
- Follow Rust naming conventions (snake_case for functions/variables, PascalCase for types)
- Use verbs for functions, nouns for structs/enums
- Be consistent with naming conventions
- Use type aliases for clarity when appropriate

**Example**:

```rust
// Bad
let d = std::time::SystemTime::now();
let u = get_user();
fn calc(x: f64, y: f64) -> f64 {
    x + y
}

// Good
let current_date = std::time::SystemTime::now();
let current_user = get_user()?;
fn calculate_total(price: f64, quantity: u32) -> f64 {
    price * quantity as f64
}
```

### 8. Small Functions

- Functions should do one thing and do it well
- Keep functions short (ideally under 20 lines)
- Extract complex logic into separate functions
- Use descriptive function names instead of comments

### 9. Error Handling

- Handle errors explicitly using `Result<T, E>` and `Option<T>`
- Use appropriate error types (create custom error types when needed)
- Provide meaningful error messages
- Don't ignore errors with `unwrap()` or `expect()` in production code
- Use `?` operator for error propagation
- Consider using error handling crates like `anyhow` or `thiserror` for better error management

**Example**:

```rust
// Bad
fn divide(a: f64, b: f64) -> f64 {
    a / b // Can panic on division by zero or produce NaN
}

// Good
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        return Err("Division by zero is not allowed".to_string());
    }
    Ok(a / b)
}

// Even better with custom error type
#[derive(Debug)]
enum MathError {
    DivisionByZero,
}

impl std::fmt::Display for MathError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MathError::DivisionByZero => write!(f, "Division by zero is not allowed"),
        }
    }
}

impl std::error::Error for MathError {}

fn divide(a: f64, b: f64) -> Result<f64, MathError> {
    if b == 0.0 {
        return Err(MathError::DivisionByZero);
    }
    Ok(a / b)
}
```

### 10. Comments and Documentation

- Write self-documenting code (code should explain itself)
- Use comments to explain "why", not "what"
- Document complex algorithms or business logic
- Keep comments up-to-date with code changes
- Use Rust doc comments (`///` for items, `//!` for module-level) for public APIs
- Include examples in documentation when helpful

**Example**:

```rust
/// Calculates the total price including tax.
///
/// # Arguments
///
/// * `price` - The base price before tax
/// * `tax_rate` - The tax rate as a decimal (e.g., 0.1 for 10%)
///
/// # Returns
///
/// The total price including tax.
///
/// # Example
///
/// ```
/// let total = calculate_price_with_tax(100.0, 0.1);
/// assert_eq!(total, 110.0);
/// ```
fn calculate_price_with_tax(price: f64, tax_rate: f64) -> f64 {
    price * (1.0 + tax_rate)
}
```

### 11. Type Safety

- Leverage Rust's strong type system effectively
- Avoid using `unsafe` unless absolutely necessary
- Use enums and pattern matching instead of string-based state
- Leverage type inference where appropriate
- Create custom types for domain concepts (use `type` aliases or newtype pattern)
- Use generics to write reusable, type-safe code

**Example**:

```rust
// Bad
fn process_user(data: &serde_json::Value) -> Result<String, String> {
    Ok(data["name"].as_str().unwrap().to_string())
}

// Good
#[derive(Debug, Clone)]
struct User {
    id: String,
    name: String,
    email: String,
}

fn process_user(user: &User) -> String {
    user.name.clone()
}

// Even better with newtype pattern for domain concepts
#[derive(Debug, Clone, PartialEq, Eq)]
struct UserId(String);

#[derive(Debug, Clone)]
struct User {
    id: UserId,
    name: String,
    email: String,
}
```

### 12. Testing Considerations

- Write testable code (pure functions, dependency injection via traits)
- Keep functions small and focused
- Avoid hidden dependencies
- Use mocks and test doubles appropriately (consider using `mockall` crate)
- Design for testability from the start
- Write unit tests in the same file with `#[cfg(test)]` modules
- Use integration tests in `tests/` directory

**Example**:

```rust
// Production code
#[cfg_attr(test, mockall::automock)]
trait Database {
    fn get_user(&self, id: &str) -> Result<User, String>;
}

struct UserService<D: Database> {
    db: D,
}

impl<D: Database> UserService<D> {
    fn new(db: D) -> Self {
        Self { db }
    }

    fn get_user_name(&self, id: &str) -> Result<String, String> {
        let user = self.db.get_user(id)?;
        Ok(user.name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_user_name() {
        let mut mock_db = MockDatabase::new();
        mock_db
            .expect_get_user()
            .returning(|_| Ok(User {
                id: UserId("1".to_string()),
                name: "John".to_string(),
                email: "john@example.com".to_string(),
            }));

        let service = UserService::new(mock_db);
        assert_eq!(service.get_user_name("1").unwrap(), "John");
    }
}
```

### 13. Performance vs. Readability

- Prefer readability over premature optimization
- Profile before optimizing (use `cargo flamegraph`, `perf`, etc.)
- Use clear algorithms first, optimize if needed
- Document performance-critical sections
- Balance between clean code and performance requirements
- Consider zero-cost abstractions (Rust's trait system, iterators)
- Use `#[inline]` judiciously, not everywhere

### 14. Code Organization

- Group related functionality together
- Use modules to organize code
- Follow consistent file and folder structures
- Separate concerns (UI, business logic, data access)
- Use `mod.rs` or `lib.rs` for module organization
- Keep modules focused and cohesive

**Example Structure**:

```
src/
├── main.rs
├── lib.rs
├── config.rs
├── models/
│   ├── mod.rs
│   └── user.rs
├── services/
│   ├── mod.rs
│   └── user_service.rs
└── repositories/
    ├── mod.rs
    └── user_repository.rs
```

### 15. Configuration Management

- Externalize configuration values
- Use environment variables for environment-specific settings
- Create configuration structs with validation
- Validate configuration at startup
- Provide sensible defaults
- Consider using crates like `config` or `dotenv` for configuration management

**Example**:

```rust
// Bad
let api_url = "https://api.example.com";
let timeout = 5000;

// Good
use std::env;

#[derive(Debug, Clone)]
struct Config {
    api_url: String,
    timeout: u64,
    max_retries: u32,
}

impl Config {
    fn from_env() -> Result<Self, String> {
        Ok(Config {
            api_url: env::var("API_URL")
                .unwrap_or_else(|_| "https://api.example.com".to_string()),
            timeout: env::var("TIMEOUT")
                .unwrap_or_else(|_| "5000".to_string())
                .parse()
                .map_err(|_| "Invalid TIMEOUT value".to_string())?,
            max_retries: env::var("MAX_RETRIES")
                .unwrap_or_else(|_| "3".to_string())
                .parse()
                .map_err(|_| "Invalid MAX_RETRIES value".to_string())?,
        })
    }
}

// Even better with a config crate
use config::{Config, Environment};

#[derive(Debug, serde::Deserialize)]
struct AppConfig {
    api_url: String,
    timeout: u64,
    max_retries: u32,
}

impl AppConfig {
    fn load() -> Result<Self, config::ConfigError> {
        Config::builder()
            .add_source(Environment::default())
            .set_default("api_url", "https://api.example.com")?
            .set_default("timeout", 5000)?
            .set_default("max_retries", 3)?
            .build()?
            .try_deserialize()
    }
}
```

### 16. Ownership and Borrowing

- Understand ownership, borrowing, and lifetimes
- Prefer borrowing (`&T`) over owned values (`T`) when possible
- Use `&str` instead of `String` for function parameters when you don't need ownership
- Use `Cow<'a, T>` when you might need either borrowed or owned data
- Avoid unnecessary cloning
- Use `Rc<T>` or `Arc<T>` for shared ownership when needed
- Use `RefCell<T>` or `Mutex<T>` for interior mutability when necessary

**Example**:

```rust
// Bad: Unnecessary ownership transfer
fn process_name(name: String) -> String {
    format!("Hello, {}", name)
}

// Good: Borrowing when ownership isn't needed
fn process_name(name: &str) -> String {
    format!("Hello, {}", name)
}

// When you might need either borrowed or owned
use std::borrow::Cow;

fn process_name<'a>(name: Cow<'a, str>) -> String {
    format!("Hello, {}", name)
}
```

### 17. Pattern Matching

- Use pattern matching (`match`, `if let`, `while let`) instead of nested if-else
- Exhaustive pattern matching helps catch bugs at compile time
- Use `_` for unused values
- Use guards in match arms for additional conditions

**Example**:

```rust
// Bad
fn get_status_message(status: &str) -> &str {
    if status == "active" {
        "User is active"
    } else if status == "inactive" {
        "User is inactive"
    } else if status == "suspended" {
        "User is suspended"
    } else {
        "Unknown status"
    }
}

// Good
enum UserStatus {
    Active,
    Inactive,
    Suspended,
}

fn get_status_message(status: UserStatus) -> &'static str {
    match status {
        UserStatus::Active => "User is active",
        UserStatus::Inactive => "User is inactive",
        UserStatus::Suspended => "User is suspended",
    }
}
```

---

## Code Review Checklist

When reviewing code, check for:

- [ ] No code duplication (DRY principle)
- [ ] Meaningful variable and function names (following Rust conventions)
- [ ] No magic numbers or strings
- [ ] Functions are small and focused
- [ ] Proper error handling (using `Result`/`Option`, not `unwrap()` in production)
- [ ] Type safety maintained (no unnecessary `unsafe`, proper use of types)
- [ ] Code is testable (dependency injection via traits)
- [ ] Documentation where needed (doc comments for public APIs)
- [ ] Consistent code style (use `rustfmt`)
- [ ] Proper abstraction levels (traits, modules)
- [ ] Extensibility considered (Open/Closed Principle)
- [ ] Single responsibility principle followed
- [ ] Ownership and borrowing used correctly
- [ ] Pattern matching used appropriately
- [ ] No unnecessary allocations or clones

---

## Summary

Clean Rust code is:

- **Readable**: Easy to understand at a glance
- **Maintainable**: Easy to modify and update
- **Testable**: Easy to write tests for
- **Extensible**: Easy to add new features
- **Reusable**: Can be used in multiple contexts
- **Well-documented**: Clear intent and purpose (using doc comments)
- **Type-safe**: Leverages Rust's strong type system effectively
- **DRY**: No unnecessary repetition
- **Abstracted**: Proper separation of concerns (using traits and modules)
- **Configurable**: Uses constants and configuration over hardcoding
- **Memory-safe**: Proper use of ownership, borrowing, and lifetimes
- **Idiomatic**: Follows Rust conventions and best practices

Remember: Code is read far more often than it is written. Write code for your future self and your teammates.

