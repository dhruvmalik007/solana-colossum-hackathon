use anchor_lang::prelude::*;

// Simple Gaussian PDF and helper integrals (scaffold)
// NOTE: On-chain math should be deterministic and use conservative rounding.

pub fn gauss_pdf(x: f64, mu: f64, sigma: f64) -> f64 {
    if sigma <= 0.0 { return 0.0; }
    let z = (x - mu) / sigma;
    let norm = 1.0 / (sigma * (2.0 * std::f64::consts::PI).sqrt());
    norm * (-0.5 * z * z).exp()
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
