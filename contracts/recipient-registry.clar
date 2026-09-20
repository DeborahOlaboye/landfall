;; Landfall - recipient registry
;;
;; Establishing that a recipient is real, eligible and not duplicated is the
;; hard problem in direct giving - harder than moving the money. We do not try
;; to solve it with a novel verification scheme. We solve it the way it is
;; already solved in practice: through an organizer who genuinely knows the
;; person - a congregation, a hometown association, a school, a clinic.
;;
;; The organizer's reputation is the collateral. Their name is on every
;; recipient they register, permanently and publicly.
;;
;; Personal details never touch the chain. `profile` is a hash of the record
;; the organizer holds off-chain, so the organizer can prove later that the
;; record has not been altered, without publishing anyone's identity.

;; ---------------------------------------------------------------- constants

(define-constant ERR-NOT-STEWARD (err u100))
(define-constant ERR-NOT-ORGANIZER (err u101))
(define-constant ERR-ORGANIZER-EXISTS (err u102))
(define-constant ERR-UNKNOWN-ORGANIZER (err u103))
(define-constant ERR-UNKNOWN-RECIPIENT (err u104))
(define-constant ERR-NOT-OWNING-ORGANIZER (err u105))
(define-constant ERR-ORGANIZER-SUSPENDED (err u106))

;; ------------------------------------------------------------------- state

;; The steward admits organizers. Deliberately a single principal for now:
;; a multisig at launch, and a governance contract once there are enough
;; organizers for that to mean anything.
(define-data-var steward principal tx-sender)
(define-data-var next-recipient-id uint u1)
(define-map organizers
  principal
  {
    name: (string-utf8 64),
    active: bool,
    joined-at: uint,
    recipients-registered: uint
  }
)
(define-map recipients
  uint
  {
    payout: principal,
    organizer: principal,
    profile: (buff 32),
    active: bool,
    registered-at: uint
  }
)

;; ------------------------------------------------------------- steward-only

(define-public (set-steward (new-steward principal))
  (begin
    (asserts! (is-eq tx-sender (var-get steward)) ERR-NOT-STEWARD)
    (var-set steward new-steward)
    (print { event: "steward-changed", steward: new-steward })
    (ok true)
  )
)
(define-public (add-organizer (who principal) (name (string-utf8 64)))
  (begin
    (asserts! (is-eq tx-sender (var-get steward)) ERR-NOT-STEWARD)
    (asserts! (is-none (map-get? organizers who)) ERR-ORGANIZER-EXISTS)
    (map-set organizers who {
      name: name,
      active: true,
      joined-at: stacks-block-height,
      recipients-registered: u0
    })
    (print { event: "organizer-added", organizer: who, name: name })
    (ok true)
  )
)
(define-public (set-organizer-active (who principal) (active bool))
  (let ((org (unwrap! (map-get? organizers who) ERR-UNKNOWN-ORGANIZER)))
    (asserts! (is-eq tx-sender (var-get steward)) ERR-NOT-STEWARD)
    (map-set organizers who (merge org { active: active }))
    (print { event: "organizer-status", organizer: who, active: active })
    (ok true)
  )
)

;; ----------------------------------------------------------- organizer-only

(define-public (register-recipient (payout principal) (profile (buff 32)))
  (let (
      (org (unwrap! (map-get? organizers tx-sender) ERR-NOT-ORGANIZER))
      (recipient-id (var-get next-recipient-id))
    )
    (asserts! (get active org) ERR-ORGANIZER-SUSPENDED)
    (map-set recipients recipient-id {
      payout: payout,
      organizer: tx-sender,
      profile: profile,
      active: true,
      registered-at: stacks-block-height
    })
    (map-set organizers tx-sender
      (merge org { recipients-registered: (+ (get recipients-registered org) u1) }))
    (var-set next-recipient-id (+ recipient-id u1))
    (print {
      event: "recipient-registered",
      recipient-id: recipient-id,
      organizer: tx-sender,
      payout: payout,
      profile: profile
    })
    (ok recipient-id)
  )
)

;; A recipient's circumstances change - they move, they no longer qualify,
;; someone else needs the slot. Only the organizer who vouched can change this.
(define-public (set-recipient-active (recipient-id uint) (active bool))
  (let ((r (unwrap! (map-get? recipients recipient-id) ERR-UNKNOWN-RECIPIENT)))
    (asserts! (is-eq tx-sender (get organizer r)) ERR-NOT-OWNING-ORGANIZER)
    (map-set recipients recipient-id (merge r { active: active }))
    (print { event: "recipient-status", recipient-id: recipient-id, active: active })
    (ok true)
  )
)

;; Phone lost, wallet rotated, mobile-money number changed. Common in practice.
(define-public (update-payout (recipient-id uint) (new-payout principal))
  (let ((r (unwrap! (map-get? recipients recipient-id) ERR-UNKNOWN-RECIPIENT)))
    (asserts! (is-eq tx-sender (get organizer r)) ERR-NOT-OWNING-ORGANIZER)
    (map-set recipients recipient-id (merge r { payout: new-payout }))
    (print {
      event: "payout-updated",
      recipient-id: recipient-id,
      payout: new-payout,
      previous: (get payout r)
    })
    (ok true)
  )
)
