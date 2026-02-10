# API Consistency Review: convex-ts vs convex-java

Comparison of TypeScript client API with the reference Java client implementation.

## ✅ Consistent APIs

### Core Methods

| Method | Java | TypeScript | Status |
|--------|------|------------|--------|
| `transact()` | ✅ | ✅ | ✅ Consistent |
| `query()` | ✅ | ✅ | ✅ Consistent |
| `query(query, address)` | ✅ | ✅ | ✅ Consistent |
| `getAddress()` | ✅ | ✅ (via `accountInfo.address`) | ✅ Consistent |
| `getKeyPair()` | ✅ | ✅ | ✅ Consistent |

### Connection Pattern

**Java:**
```java
// Anonymous connection (queries only)
Convex.connect(hostAddress)

// With account
Convex.connect(hostAddress, address, keyPair)
```

**TypeScript:**
```typescript
// Connection (queries only)
new Convex('https://peer.convex.live')

// With account
convex.useAccount('#1678', keyPair)
```

✅ **Status:** Consistent pattern, different implementation style (Java: static factory, TS: instance method)

## ⚠️ Missing in TypeScript

### 1. `transfer()` Convenience Method

**Java:**
```java
convex.transfer(targetAddress, amount)
```

**Current TypeScript workaround:**
```typescript
convex.transact({ to: '#456', amount: 1_000_000 })
```

**Recommendation:** Add `transfer()` method for consistency:
```typescript
async transfer(to: string, amount: number): Promise<TransactionResult> {
  return this.transact({ to, amount });
}
```

### 2. `setTimeout()` Method

**Java:**
```java
convex.setTimeout(30000)
```

**TypeScript:** Timeout is set in constructor only

**Recommendation:** Add setter:
```typescript
setTimeout(timeout: number): void {
  this.http.defaults.timeout = timeout;
}
```

### 3. `getSequence()` Method

**Java:**
```java
long seq = convex.getSequence()
```

**TypeScript:** Sequence accessed via `accountInfo.sequence`

**Recommendation:** Add convenience method:
```typescript
async getSequence(): Promise<number> {
  const info = await this.getAccountInfo();
  return info.sequence;
}
```

### 4. `setAddress()` Method

**Java:**
```java
convex.setAddress(address)
convex.setAddress(address, keyPair)
```

**TypeScript:** Only `useAccount(address, keyPair)`

**Recommendation:** Keep `useAccount()` as primary API (more explicit), optionally add `setAddress()` as alias

## 📝 API Naming Differences

### Address Format

**Java:**
- Uses `Address` objects
- Created with `Address.create(1678)`

**TypeScript:**
- Uses strings: `"#1678"`
- More user-friendly

✅ **Status:** Acceptable difference - JavaScript/TypeScript convention

### Async/Sync Methods

**Java:**
```java
Result r = convex.transactSync(code);        // Blocking
Future<Result> f = convex.transact(code);    // Async
```

**TypeScript:**
```typescript
const result = await convex.transact(code);  // Promise-based (async)
```

✅ **Status:** Consistent with platform conventions (Java: Future, TS: Promise)

## 🔄 Method Signature Comparison

### `transact()`

**Java:**
```java
// Multiple overloads
CompletableFuture<Result> transact(ATransaction transaction)
CompletableFuture<Result> transact(String code)
CompletableFuture<Result> transact(ACell code)
Result transactSync(String code)
```

**TypeScript:**
```typescript
async transact(tx: Transaction): Promise<TransactionResult>
```

⚠️ **Issue:** TypeScript only accepts Transaction object, not code strings

**Recommendation:** Add code execution overload:
```typescript
async transact(tx: Transaction | string): Promise<TransactionResult> {
  if (typeof tx === 'string') {
    return this.transact({ data: { code: tx } });
  }
  // existing implementation
}
```

### `query()`

**Java:**
```java
CompletableFuture<Result> query(String query)
CompletableFuture<Result> query(ACell query, Address address)
Result querySync(String query)
```

**TypeScript:**
```typescript
async query(query: Query): Promise<Result>

interface Query {
  address?: string;
  source?: any;
}
```

✅ **Status:** Consistent, TypeScript uses object parameter (more flexible)

## 🎯 Recommendations

### High Priority

1. ✅ **Add `transfer()` method** - Common operation, should be easy
2. ✅ **Add `transact(code: string)` overload** - Execute code strings directly
3. ⚠️ **Add `getSequence()` method** - Useful for transaction management

### Medium Priority

4. ⚠️ **Add `setTimeout()` method** - Runtime timeout adjustment
5. ⚠️ **Consider `setAddress()` alias** - For Java developers

### Low Priority

6. ⚠️ **Document equivalent patterns** - Help Java developers migrate

## 📚 Example: Equivalent Usage

### Java
```java
Convex convex = Convex.connect("peer.convex.live", address, keyPair);
Result r = convex.transferSync(target, 1_000_000);
```

### TypeScript (Current)
```typescript
const convex = new Convex('https://peer.convex.live');
convex.useAccount('#1678', keyPair);
const result = await convex.transact({ to: '#456', amount: 1_000_000 });
```

### TypeScript (With Improvements)
```typescript
const convex = new Convex('https://peer.convex.live');
convex.useAccount('#1678', keyPair);
const result = await convex.transfer('#456', 1_000_000);
```

## ✅ Conclusion

The TypeScript API is **largely consistent** with the Java API, with minor differences due to:
- JavaScript/TypeScript conventions (Promises vs Futures)
- Platform idioms (strings vs objects)

**Key improvements needed:**
1. Add `transfer()` method
2. Support `transact(code)` with string
3. Add `getSequence()` helper

These changes would make the TypeScript API nearly identical to the Java API in functionality.
