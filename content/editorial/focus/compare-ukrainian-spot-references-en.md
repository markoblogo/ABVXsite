# **Comparing Ukrainian Grain and Oilseed Spot References**

Comparing spot references starts by checking whether the observations describe comparable conditions. A grain indication at one location and delivery basis may not be directly comparable with an oilseed reference elsewhere or on another date. Quality, currency, freight assumptions and the source of each observation matter alongside the headline number.

A structured index or dated market view can make comparison more repeatable, provided the scope and methodology remain visible. [SPIKE](/work/spike-spot-commodity-index-ukraine) and [UGA Index](/work/uga-index) illustrate public reference-price surfaces in the Ukrainian market context. Users should treat them as defined inputs for analysis, then decide whether those inputs fit the transaction they are evaluating.

## Worked example: the headline spread can disappear

The following is my illustrative comparison worksheet. **All prices and costs are invented for this example**, expressed in USD per metric tonne; they are not current SPIKE or UGA observations, executable offers or a freight quotation. Assume the two records refer to corn with the same stated quality, observation day, delivery window, tax treatment and payment terms.

- **Record A — origin offer:** 200 USD/t at the origin location. To compare it with a port-delivered observation, assume an additional 24 USD/t for the specified transport and handling leg. The working comparable level is **200 + 24 = 224 USD/t**.
- **Record B — port-delivered reference:** 230 USD/t at the same destination and delivery window. Treat this as an indicative reference, not as a buyer committed to taking the cargo.
- **Headline difference:** 230 − 200 = 30 USD/t. This mixes delivery conditions and therefore overstates what the comparison tells us.
- **Difference after the stated adjustment:** 230 − 224 = **6 USD/t**. This is a residual difference under the assumptions, not a profit estimate; omitted costs or different terms can consume it.

A simple sensitivity check makes the limitation visible. If the transport and handling assumption rises from 24 to 32 USD/t, the comparable origin level becomes **200 + 32 = 232 USD/t**. It now sits **2 USD/t above** the 230 USD/t reference. The same two headline observations produce a different conclusion when one explicit input changes.

## How I would make the worksheet inspectable

Keep each observation intact before adding a comparison. For both records, write down the source, observation time, commodity and quality, currency, unit, precise location, delivery basis, delivery window, tax treatment, payment terms and whether it is a reference, bid, offer or completed transaction. Keep the cost estimate in its own field, with its source and the leg it covers.

Then work through three checks:

1. **Match the conditions.** If the commodity, specification, time or delivery window differs, explain the mismatch before calculating a spread. Currency conversion alone cannot make different products or locations comparable.
2. **Document the adjustment.** Include only costs justified for the particular route and agreed responsibilities. Do not add a second freight charge when it is already included, or assume a universal adjustment between delivery bases.
3. **State what is still unconfirmed.** A reference can support a discussion even when volume availability, final quality, transport capacity, executable counterparties or commercial terms remain unknown. Record those gaps rather than presenting the residual difference as an opportunity ready to trade.

## Apply the method to the public index pages

[SPIKE](/work/spike-spot-commodity-index-ukraine) and [UGA Index](/work/uga-index) provide concrete reference surfaces to inspect. Start with the position label and its methodology, then retain the date and delivery conditions next to the value. Their public scope is described in the [Index Platform repository](https://github.com/markoblogo/index). The existence of two published values does not, by itself, establish that their underlying observations are interchangeable.

The worksheet above deliberately uses an origin-to-destination cost example rather than presenting a formula for changing contractual delivery terms. The [ICC overview of Incoterms rules](https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/) is the primary starting point for understanding those terms; actual responsibilities still need to be checked against the transaction.

For the wider operating context, see [how I map observation, reference and brokerage handoffs](/editorial/focus/agro-commodity-market-infrastructure-en).

Related project and reading links: [SPIKE](/work/spike-spot-commodity-index-ukraine) · [UGA Index](/work/uga-index).
