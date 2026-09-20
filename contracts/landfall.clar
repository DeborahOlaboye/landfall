;; Landfall - direct giving with proof of arrival
;;
;; The whole idea: there is no intermediary holding the money, so there is
;; nothing to audit. A donor pays a named recipient directly and the
;; settlement itself is the receipt.
;;
;; Every disbursement is recorded on chain at the block it landed in. That is
;; the part a donor can check independently, years later, without trusting
;; that this contract - or the company that deployed it - still exists.

(use-trait ft-trait .sip-010-trait.sip-010-trait)

;; ---------------------------------------------------------------- constants

(define-constant ERR-UNKNOWN-RECIPIENT (err u200))
(define-constant ERR-NOT-PAYABLE (err u201))
(define-constant ERR-ZERO-AMOUNT (err u202))
(define-constant ERR-TRANSFER-FAILED (err u203))
(define-constant ERR-UNKNOWN-RECEIPT (err u204))
(define-constant ERR-SELF-GIFT (err u205))

;; ------------------------------------------------------------------- state

(define-data-var next-receipt-id uint u1)
(define-data-var total-landed-stx uint u0)

;; asset: none = STX, some = the SIP-010 contract that moved
(define-map receipts
  uint
  {
    donor: principal,
    recipient-id: uint,
    payout: principal,
    amount: uint,
    asset: (optional principal),
    memo: (optional (buff 34)),
    stacks-height: uint
  }
)

;; Running totals, so a recipient page or a donor page renders from one read
;; instead of replaying every event.
(define-map recipient-received { recipient-id: uint, asset: (optional principal) } uint)
(define-map donor-given { donor: principal, asset: (optional principal) } uint)

;; --------------------------------------------------------------- internals

(define-private (record
    (recipient-id uint)
    (payout principal)
    (amount uint)
    (asset (optional principal))
    (memo (optional (buff 34)))
  )
  (let (
      (receipt-id (var-get next-receipt-id))
      (recipient-key { recipient-id: recipient-id, asset: asset })
      (donor-key { donor: tx-sender, asset: asset })
    )
    (map-set receipts receipt-id {
      donor: tx-sender,
      recipient-id: recipient-id,
      payout: payout,
      amount: amount,
      asset: asset,
      memo: memo,
      stacks-height: stacks-block-height
    })
    (map-set recipient-received recipient-key
      (+ (default-to u0 (map-get? recipient-received recipient-key)) amount))
    (map-set donor-given donor-key
      (+ (default-to u0 (map-get? donor-given donor-key)) amount))
    (var-set next-receipt-id (+ receipt-id u1))
    (print {
      event: "landed",
      receipt-id: receipt-id,
      donor: tx-sender,
      recipient-id: recipient-id,
      payout: payout,
      amount: amount,
      asset: asset,
      memo: memo,
      stacks-height: stacks-block-height
    })
    receipt-id
  )
)

;; ------------------------------------------------------------------ public

;; Give STX directly to a registered recipient.
(define-public (give (recipient-id uint) (amount uint) (memo (optional (buff 34))))
  (let (
      (r (unwrap! (contract-call? .recipient-registry get-recipient recipient-id)
                  ERR-UNKNOWN-RECIPIENT))
      (payout (get payout r))
    )
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (contract-call? .recipient-registry is-payable recipient-id) ERR-NOT-PAYABLE)
    (asserts! (not (is-eq tx-sender payout)) ERR-SELF-GIFT)
    (try! (stx-transfer? amount tx-sender payout))
    (var-set total-landed-stx (+ (var-get total-landed-stx) amount))
    (ok (record recipient-id payout amount none memo))
  )
)

;; Give any SIP-010 token directly to a registered recipient.
(define-public (give-token
    (token <ft-trait>)
    (recipient-id uint)
    (amount uint)
    (memo (optional (buff 34)))
  )
  (let (
      (r (unwrap! (contract-call? .recipient-registry get-recipient recipient-id)
                  ERR-UNKNOWN-RECIPIENT))
      (payout (get payout r))
    )
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (contract-call? .recipient-registry is-payable recipient-id) ERR-NOT-PAYABLE)
    (asserts! (not (is-eq tx-sender payout)) ERR-SELF-GIFT)
    (unwrap! (contract-call? token transfer amount tx-sender payout memo)
             ERR-TRANSFER-FAILED)
    (ok (record recipient-id payout amount (some (contract-of token)) memo))
  )
)
