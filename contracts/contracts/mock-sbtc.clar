;; Test-only stand-in for sBTC.
;;
;; Mirrors the SIP-010 surface of the real token closely enough to exercise
;; the disbursement path in simnet. Mainnet uses the canonical contract:
;;   SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
;; This one is never deployed anywhere but a test chain.

(impl-trait .sip-010-trait.sip-010-trait)

(define-fungible-token sbtc)

(define-constant ERR-NOT-OWNER (err u4))

(define-public (transfer
    (amount uint)
    (sender principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-OWNER)
    (try! (ft-transfer? sbtc amount sender recipient))
    (ok true)
  )
)

;; Test helper. The real sBTC mints only against a Bitcoin deposit.
(define-public (mint (amount uint) (to principal))
  (ft-mint? sbtc amount to)
)

(define-read-only (get-name) (ok "sBTC"))
(define-read-only (get-symbol) (ok "sBTC"))
(define-read-only (get-decimals) (ok u8))
(define-read-only (get-balance (who principal)) (ok (ft-get-balance sbtc who)))
(define-read-only (get-total-supply) (ok (ft-get-supply sbtc)))
(define-read-only (get-token-uri) (ok none))
