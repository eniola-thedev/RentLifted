// Questions and answers for /faq (also linked from /help). Keep answers in line with how the app actually works.
export const FAQS = [
  { id: "tenants", title: "For tenants", items: [
    ["How does monthly rent work?", "We pay your landlord the full year’s rent upfront. You pay us back in 12 monthly instalments from your RENTLIFTED wallet."],
    ["Who can rent monthly?", "Anyone who completes verification (identity, work and income, and a saved payment card) and whose monthly rent is no more than 30% of their verified monthly income."],
    ["What do I need to verify my account?", "Your email, your BVN or NIN and a selfie, details of your work and income with bank statements, your address and a guarantor, and a payment card."],
    ["When is my rent due?", "On the same day each month, based on your start date. If you start on the 14th, rent is due on the 14th of every month."],
    ["What if I can’t pay on the due date?", "You have 5 days’ grace to top up your wallet. After that, we charge your saved card for whatever is missing. If you’re struggling, contact us before the due date."],
    ["How do I add money to my wallet?", "Go to your wallet and choose Fund wallet. You can pay by card or bank transfer through Paystack, as often as you like."],
    ["Can I browse before I’m verified?", "Yes. You can see every home and use the filters. You only need to be verified to apply."],
  ] },
  { id: "landlords", title: "For landlords", items: [
    ["How much does it cost to list?", "A one-time fee of ₦2,000 per property, paid when you first submit it. Edits and resubmissions are free. If our team lists it for you after a visit, there’s no fee."],
    ["What do I need to list a property?", "Verification Level 2 (email, phone and your BVN or NIN with a selfie), 2 to 5 photos and 1 or 2 videos of the property."],
    ["When do I get paid?", "When we approve a tenant for monthly rent, we pay you the full year’s rent upfront. To receive it, finish verification Level 3: proof of ownership and your bank account."],
    ["Why was my listing sent back?", "Our team checks every listing. If something needs changing, you’ll see a note on the listing. Make the change and submit it again; there’s no extra fee."],
    ["Can you list my property for me?", "Yes. Contact us to book a visit. We’ll take your details, photos and a video, and list it for you at no cost."],
  ] },
  { id: "account", title: "Account and safety", items: [
    ["I didn’t get my confirmation email.", "Check your spam or promotions folder. On the confirmation page you can ask for a new link. Links expire after an hour."],
    ["Is my information safe?", "We use your details only to verify you and run your account. Identity checks are done by our verification partner against official records. See our privacy policy for more."],
    ["Is land for sale on RENTLIFTED?", "Not yet. Land sales are coming soon, with verified titles and safe payments."],
  ] },
] as const;
