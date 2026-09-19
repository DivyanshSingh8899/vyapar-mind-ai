// One-off smoke test for the 5-language agent. Delete after use.
import { ConvexHttpClient } from "convex/browser";
import { api } from "../src/convex/_generated/api";

const client = new ConvexHttpClient("https://silent-husky-948.convex.cloud");

const cases: { lang: string; text: string; expect: string }[] = [
  { lang: "ta", text: "இன்று எவ்வளவு வியாபாரம் நடந்தது?", expect: "SALES_QUERY" },
  { lang: "ta", text: "30 நாட்களாக யாரும் வரவில்லையா?", expect: "CUSTOMER_INSIGHT" },
  { lang: "ta", text: "பால் சரக்கு எவ்வளவு இருக்கிறது?", expect: "INVENTORY_QUERY" },
  { lang: "ta", text: "ரமேஷ் கடன் ₹500 புதுப்பி.", expect: "UDHAAR_UPDATE" },
  { lang: "te", text: "ఈరోజు ఎంత వ్యాపారం జరిగింది?", expect: "SALES_QUERY" },
  { lang: "te", text: "పాలు స్టాక్ ఎంత ఉంది?", expect: "INVENTORY_QUERY" },
  { lang: "te", text: "రమేష్ అప్పు ₹500 అప్‌డేట్ చెయ్యి.", expect: "UDHAAR_UPDATE" },
  { lang: "kn", text: "ಇಂದು ಎಷ್ಟು ವ್ಯಾಪಾರ ಆಯಿತು?", expect: "SALES_QUERY" },
  { lang: "kn", text: "ಹಾಲು ಸ್ಟಾಕ್ ಎಷ್ಟು ಇದೆ?", expect: "INVENTORY_QUERY" },
  { lang: "kn", text: "ರಮೇಶ್ ಸಾಲ ₹500 ಅಪ್‌ಡೇಟ್ ಮಾಡು.", expect: "UDHAAR_UPDATE" },
  { lang: "en", text: "How much business did I do today?", expect: "SALES_QUERY" },
  { lang: "hi", text: "Aaj kitna business hua?", expect: "SALES_QUERY" },
];

async function main() {
  await client.mutation(api.vyapar.ensureDemoMerchant, {});
  let pass = 0;
  let fail = 0;
  for (const c of cases) {
    const r = await client.mutation(api.vyapar.agentTurn, {
      text: c.text,
      source: "demo",
      lang: c.lang,
    });
    const ok = r.intent === c.expect && r.lang === c.lang;
    if (ok) pass++;
    else fail++;
    console.log(
      `${ok ? "PASS" : "FAIL"} [${c.lang}] intent=${r.intent} (want ${c.expect})`,
    );
    console.log(`      → ${r.response.slice(0, 90)}`);
  }
  console.log(`\n${pass}/${cases.length} passed`);
  if (fail > 0) process.exit(1);
}

main();
