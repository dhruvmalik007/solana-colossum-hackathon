# Authentication & Deployment Updates

## Part 1: AWS Amplify Deployment URL Fix

### Problem
GitHub Actions workflows were unable to retrieve the live deployment URL after successful AWS Amplify builds, preventing automated deployment notifications and PR comments with live links.

### Solution
Updated both GitHub Actions workflows to properly construct and retrieve Amplify deployment URLs:

#### Changes Made

**1. `.github/workflows/deploy-amplify-frontend.yml`**
- Added robust URL construction logic in "Get Deployment URL" step
- Uses `aws amplify get-app` to fetch default domain
- Constructs branch-specific URL: `https://<branch-name>.<app-id>.amplifyapp.com`
- Includes fallback logic if domain is unavailable
- Validates URL format before output

**2. `.github/workflows/trigger-amplify-builds.yml`**
- Added new "Get Deployment URL" step after build completion
- Mirrors URL construction from deploy workflow
- Outputs deployment URL for PR comments
- Updated PR comment template to include deployment URL

#### Key Implementation Details

```bash
# Construct branch-specific deployment URL
DOMAIN="$APP_INFO"
if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "None" ]; then
  DOMAIN="${APP_ID}.amplifyapp.com"
fi
URL="https://${BRANCH}.${DOMAIN}"
```

#### Workflow Output
- PR comments now include: `**Deployment URL:** https://<branch>.<app-id>.amplifyapp.com`
- Deployment summary includes live URL
- Both dev and prod environments supported

---

## Part 2: Creator Authentication & Onboarding

### Architecture

#### 1. Protected Routes
**File:** `apps/web/components/auth/ProtectedRoute.tsx`
- HOC wrapper for authenticated-only pages
- Redirects unauthenticated users to `/login`
- Shows loading state during auth check
- Uses Privy's `usePrivy()` hook

#### 2. Standardized Auth Flow
**Existing:** `apps/web/app/login/page.tsx`
- Email, Google, and Wallet login methods via Privy
- Unified entry point for both creators and participants
- Redirects authenticated users to onboarding or dashboard

#### 3. Creator Onboarding (5-Step Stepper)
**File:** `apps/web/app/creator-onboarding/page.tsx`

**Step 1: Role Selection**
- Creator: Create and manage markets
- Participant: Trade and participate
- Both: Full access
- Button-based selection with visual feedback

**Step 2: Portfolio Connection**
- Connects user's Solana wallet
- Fetches on-chain portfolio data via `/api/portfolio`
- Displays wallet address for confirmation

**Step 3: Credentials Verification**
- Displays portfolio stats:
  - SOL balance
  - Token holdings count
  - NFT count
  - Total portfolio value
- Shows verification success badge

**Step 4: Profile Setup**
- Display name (min 3 chars)
- Bio (min 20 chars)
- Website (optional)
- Smooth form transitions

**Step 5: Completion**
- Summary of profile data
- Success confirmation
- Redirect to markets dashboard

#### 4. Protected Market Creation
**File:** `apps/web/app/create/page.tsx`
- Wrapped with `<ProtectedRoute>`
- Requires completed onboarding
- 6-step market creation stepper
- Zod validation with proper error handling

### API Endpoints

#### `/api/portfolio` (POST)
**Purpose:** Fetch on-chain portfolio data for verification

**Request:**
```json
{
  "walletAddress": "string"
}
```

**Response:**
```json
{
  "data": {
    "walletAddress": "string",
    "solBalance": number,
    "tokenHoldings": [
      {
        "mint": "string",
        "symbol": "string",
        "amount": number,
        "value": number
      }
    ],
    "nftHoldings": number
  }
}
```

**Implementation:** `apps/web/app/api/portfolio/route.ts`
- Connects to Solana RPC
- Fetches token accounts via `getParsedTokenAccountsByOwner`
- Filters for non-zero balances
- Returns top 10 holdings

#### `/api/creator-profile` (POST)
**Purpose:** Create and store creator profile after onboarding

**Request:**
```json
{
  "userId": "string",
  "walletAddress": "string",
  "role": "creator" | "participant" | "both",
  "displayName": "string",
  "bio": "string",
  "website": "string (optional)",
  "portfolioStats": {
    "totalMarketsCreated": number,
    "totalVolume": number,
    "successRate": number,
    "averageAccuracy": number
  }
}
```

**Response:**
```json
{
  "data": { ...profile },
  "message": "Creator profile created successfully"
}
```

**Implementation:** `apps/web/app/api/creator-profile/route.ts`
- Stores profile in database via `putCreatorProfile`
- Sets verification status to "pending"
- Returns created profile

### Type Definitions

**File:** `apps/web/lib/types/creator.ts`

```typescript
type CreatorRole = "creator" | "participant" | "both";
type CreatorOnboardingStep = "role-select" | "portfolio-connect" | "credentials-verify" | "profile-setup" | "complete";

interface CreatorProfile {
  userId: string;
  walletAddress: string;
  role: CreatorRole;
  portfolioConnected: boolean;
  portfolioStats?: { ... };
  profileData?: { ... };
  verificationStatus: "pending" | "verified" | "rejected";
  createdAt: string;
  updatedAt: string;
}

interface PortfolioData {
  walletAddress: string;
  solBalance: number;
  tokenHoldings: Array<{ ... }>;
  nftHoldings: number;
  stakingInfo?: { ... };
  defiPositions?: Array<{ ... }>;
}
```

### User Flow

```
1. User lands on app
   ↓
2. Clicks "Create Market" or "Sign Up"
   ↓
3. Redirected to /login (if not authenticated)
   ↓
4. Authenticates via Privy (email/Google/wallet)
   ↓
5. Redirected to /creator-onboarding
   ↓
6. Completes 5-step onboarding:
   - Selects role
   - Connects portfolio
   - Verifies credentials
   - Sets up profile
   - Completes
   ↓
7. Redirected to /markets dashboard
   ↓
8. Can now create markets via /create (protected)
```

### Database Integration

**Required Database Functions:**
- `putCreatorProfile(profile: CreatorProfile)` - Store creator profile
- `getCreatorProfile(userId: string)` - Retrieve creator profile
- `updateCreatorProfile(userId: string, updates: Partial<CreatorProfile>)` - Update profile

**Implementation Location:** `@repo/database` package

### Security Considerations

1. **Authentication:**
   - Privy handles wallet/email verification
   - JWT tokens managed by Privy
   - Protected routes check `usePrivy().authenticated`

2. **On-Chain Verification:**
   - Portfolio data fetched from Solana RPC (read-only)
   - No private keys exposed
   - Wallet address verified via Privy

3. **Profile Verification:**
   - Initial status: "pending"
   - Admin review process (future enhancement)
   - Can be updated to "verified" or "rejected"

### Future Enhancements

1. **Admin Dashboard:**
   - Review pending creator profiles
   - Approve/reject based on portfolio metrics
   - Set verification status

2. **Portfolio Scoring:**
   - Calculate creator reputation score
   - Factor in: SOL balance, token diversity, NFT holdings, trading history
   - Display on profile

3. **Onboarding Analytics:**
   - Track completion rates
   - Identify drop-off points
   - Optimize UX based on data

4. **Social Features:**
   - Creator profiles visible to participants
   - Reputation badges
   - Market history and performance metrics

---

## Testing Checklist

### Deployment URL
- [ ] Push to main branch triggers deploy workflow
- [ ] PR comment includes deployment URL
- [ ] URL format: `https://<branch>.<app-id>.amplifyapp.com`
- [ ] Dev and prod environments both work

### Authentication
- [ ] Login page loads without auth
- [ ] Email login works
- [ ] Google login works
- [ ] Wallet login works
- [ ] Authenticated users redirect to onboarding

### Onboarding
- [ ] All 5 steps render correctly
- [ ] Role selection works
- [ ] Portfolio fetch succeeds
- [ ] Portfolio data displays correctly
- [ ] Profile form validates input
- [ ] Completion redirects to markets

### Protected Routes
- [ ] Unauthenticated users redirected to login
- [ ] Create page requires authentication
- [ ] Create page requires completed onboarding
- [ ] Loading state shows during auth check

### API Endpoints
- [ ] `/api/portfolio` returns correct data
- [ ] `/api/creator-profile` stores profile
- [ ] Error handling works for invalid inputs
- [ ] Database integration successful

---

## Deployment Instructions

1. **Update GitHub Secrets:**
   ```
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   AWS_REGION
   AMPLIFY_APP_ID (optional)
   ```

2. **Update Environment Variables:**
   ```
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   ```

3. **Database Setup:**
   - Ensure `putCreatorProfile` function exists in `@repo/database`
   - Run migrations if needed

4. **Deploy:**
   ```bash
   git push origin main
   # Workflows trigger automatically
   ```

---

## Files Modified/Created

### Modified
- `.github/workflows/deploy-amplify-frontend.yml`
- `.github/workflows/trigger-amplify-builds.yml`
- `apps/web/app/create/page.tsx`

### Created
- `apps/web/components/auth/ProtectedRoute.tsx`
- `apps/web/app/creator-onboarding/page.tsx`
- `apps/web/app/api/portfolio/route.ts`
- `apps/web/app/api/creator-profile/route.ts`
- `apps/web/lib/types/creator.ts`
