// Quick script to check existing data structure in AWS
const endpoint = "https://kcd5p6fz5zdfvjxnpczz7fnotu.appsync-api.us-west-1.amazonaws.com/graphql";
const apiKey = "da2-gxwq5onocjampa25fci2af46oq";

async function checkSchema() {
  console.log("🔍 Checking what fields exist in AWS GraphQL schema...\n");
  
  // Query to check Couple structure
  const coupleQuery = `
    query IntrospectCouple {
      __type(name: "Couple") {
        name
        fields {
          name
          type {
            name
            kind
            ofType { name kind }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ query: coupleQuery }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error("❌ GraphQL Errors:", result.errors);
      return;
    }

    const fields = result.data?.__type?.fields || [];
    console.log("📋 Couple type fields in AWS:");
    
    const ownerField = fields.find(f => f.name === 'owner');
    const ownersField = fields.find(f => f.name === 'owners');
    const netBalanceField = fields.find(f => f.name === 'netBalance');
    
    console.log("  - owner field:", ownerField ? "✅ EXISTS (old schema)" : "❌ NOT FOUND");
    console.log("  - owners field:", ownersField ? "⚠️ EXISTS (new schema)" : "❌ NOT FOUND");
    console.log("  - netBalance field:", netBalanceField ? "⚠️ EXISTS (aggregates)" : "❌ NOT FOUND");
    
    console.log("\n📝 All fields:");
    fields.forEach(f => {
      console.log(`  - ${f.name}`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function checkData() {
  console.log("\n🔍 Checking existing Couple data...\n");
  
  const dataQuery = `
    query {
      listCouples(limit: 10) {
        items {
          id
          name
          partner1Id
          partner1Name
        }
      }
    }
  `;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ query: dataQuery }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error("❌ GraphQL Errors:", result.errors);
      return;
    }

    const couples = result.data?.listCouples?.items || [];
    console.log(`📊 Found ${couples.length} couple(s):`);
    
    couples.forEach((c, i) => {
      console.log(`  ${i + 1}. "${c.name}" (${c.partner1Name})`);
    });

    if (couples.length === 0) {
      console.log("  ✅ No data - safe to push any schema!");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkSchema().then(() => checkData());
