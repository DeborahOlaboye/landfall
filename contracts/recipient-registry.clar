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
