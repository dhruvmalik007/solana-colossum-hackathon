
// Simple Gaussian PDF and helper integrals (scaffold)
// NOTE: On-chain math should be deterministic and use conservative rounding.

pub fn gauss_pdf(x: f64, mu: f64, sigma: f64) -> f64 {
    if sigma <= 0.0 { return 0.0; }
    let z = (x - mu) / sigma;
    let norm = 1.0 / (sigma * (2.0 * std::f64::consts::PI).sqrt());
    norm * (-0.5 * z * z).exp()
}

/// Standard normal CDF approximation (Abramowitz–Stegun 7.1.26)
/// Max error ~7.5e-8 for x >= 0 (use symmetry for x < 0)
pub fn phi_cdf_as(z: f64) -> f64 {
    // Handle symmetry
    if z < 0.0 {
        return 1.0 - phi_cdf_as(-z);
    }
    // Coefficients
    let p = 0.231_641_9_f64;
    let a1 = 0.319_381_530_f64;
    let a2 = -0.356_563_782_f64;
    let a3 = 1.781_477_937_f64;
    let a4 = -1.821_255_978_f64;
    let a5 = 1.330_274_429_f64;
    // t = 1 / (1 + p * z)
    let t = 1.0 / (1.0 + p * z);
    // standard normal pdf at z
    let pdf = (1.0 / (2.0 * std::f64::consts::PI).sqrt()) * (-0.5 * z * z).exp();
    let poly = a1 * t + a2 * t * t + a3 * t.powi(3) + a4 * t.powi(4) + a5 * t.powi(5);
    1.0 - pdf * poly
}

/// Discretized integral of |g(x) - f(x)| over [min, max] with step.
/// Returns the L1 distance approximation.
pub fn discretized_l1_distance<F, G>(min: f64, max: f64, step: f64, f: F, g: G) -> f64
where
    F: Fn(f64) -> f64,
    G: Fn(f64) -> f64,
{
    if step <= 0.0 || max <= min { return 0.0; }
    let mut acc = 0.0;
    let mut x = min;
    while x <= max {
        let df = (g(x) - f(x)).abs();
        acc += df * step;
        x += step;
    }
    acc
}

/// Discretized L2 norm squared integral approximation of difference between two PDFs.
pub fn discretized_l2_sq<F, G>(min: f64, max: f64, step: f64, f: F, g: G) -> f64
where
    F: Fn(f64) -> f64,
    G: Fn(f64) -> f64,
{
    if step <= 0.0 || max <= min { return 0.0; }
    let mut acc = 0.0;
    let mut x = min;
    while x <= max {
        let d = g(x) - f(x);
        acc += d * d * step;
        x += step;
    }
    acc
}

/// Conservative rounding helper (round against trader): floors positive values and ceilings negative values.
pub fn conservative_round(amount: f64) -> i64 {
    if amount >= 0.0 { amount.floor() as i64 } else { amount.ceil() as i64 }
}

pub fn effective_liquidity(l0: u64, dynamic_on: u8, expiry_ts: i64, now_ts: i64) -> f64 {
    if dynamic_on == 0 { return l0 as f64; }
    let dt = (expiry_ts - now_ts).max(1) as f64;
    let mut l = (l0 as f64) * dt.sqrt();
    if !l.is_finite() || l <= 0.0 { l = l0 as f64; }
    let cap = (l0 as f64) * 1_000_000.0;
    if l > cap { cap } else { l }
}
