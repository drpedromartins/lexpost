const express=require("express"),path=require("path"),app=express();
app.use(express.json({limit:"2mb"}));

app.get("/",(req,res)=>{res.sendFile(path.join(__dirname,"index.html"))});

app.post("/api/generate",async(req,res)=>{
  const k=process.env.ANTHROPIC_API_KEY;
  if(!k)return res.status(500).json({error:"API key missing"});
  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01"},body:JSON.stringify(req.body)});
    const d=await r.json();
    res.status(r.status).json(d);
  }catch(e){res.status(500).json({error:e.message})}
});

app.get("/api/trending-themes",async(req,res)=>{
  const k=process.env.ANTHROPIC_API_KEY;
  if(!k)return res.status(500).json({error:"API key missing"});
  const hoje=new Date();
  const dia=hoje.getDate().toString().padStart(2,"0");
  const mes=(hoje.getMonth()+1).toString().padStart(2,"0");
  const ano=hoje.getFullYear();
  const dataHoje=dia+"/"+mes+"/"+ano;
  const diaSemana=["domingo","segunda-feira","terca-feira","quarta-feira","quinta-feira","sexta-feira","sabado"][hoje.getDay()];
  const prompt="Hoje e "+diaSemana+", "+dataHoje+".\n\nVoce e um especialista em direito do trabalho e direito previdenciario brasileiro com profundo conhecimento do noticiario juridico atual.\n\nSua tarefa: identificar 8 temas juridicos relevantes AGORA para criadores de conteudo juridico no Instagram, considerando:\n1. Legislacao trabalhista e previdenciaria em discussao ou aprovacao recente\n2. Decisoes do TST, STF ou INSS que impactam trabalhadores\n3. Temas do cotidiano do trabalhador brasileiro\n4. Datas comemorativas ou periodos especiais\n5. Reformas e projetos de lei em tramitacao\n6. Situacoes economicas que afetam direitos trabalhistas\n\nRetorne APENAS um JSON valido, sem markdown, sem texto antes ou depois:\n{\"temas\":[{\"titulo\":\"Titulo do tema (max 70 chars)\",\"relevancia\":\"alta\",\"area\":\"trabalhista\"},{\"titulo\":\"...\",\"relevancia\":\"media\",\"area\":\"previdenciario\"}]}\n\nRegras:\n- Exatamente 8 temas\n- Minimo 3 trabalhista, minimo 2 previdenciario, minimo 1 cotidiano\n- Titulos formulados como TEMAS para carrosseis de Instagram\n- Exemplo correto: \"Demissao por Justa Causa: O Que Mudou em 2025\"\n- Para area use: trabalhista, previdenciario ou cotidiano\n- Para relevancia use: alta ou media";
  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:800,system:"Retorne APENAS JSON valido. Sem markdown. Comece com { e termine com }",messages:[{role:"user",content:prompt}]})});
    const d=await r.json();
    const raw=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();
    let parsed=null;
    try{parsed=JSON.parse(raw);}catch(_){const m=raw.match(/\{[\s\S]*\}/);if(m)try{parsed=JSON.parse(m[0]);}catch(_){}}
    if(!parsed||!parsed.temas||!parsed.temas.length)throw new Error("Formato invalido");
    res.json({success:true,temas:parsed.temas,geradoEm:new Date().toISOString()});
  }catch(err){
    console.error("[trending-themes] Erro:",err.message);
    res.json({success:false,temas:[
      {titulo:"Demissao Sem Justa Causa: Seus Direitos Completos",relevancia:"alta",area:"trabalhista"},
      {titulo:"INSS: Novas Regras de Aposentadoria e Beneficios",relevancia:"alta",area:"previdenciario"},
      {titulo:"Horas Extras e Banco de Horas: O Que a Lei Diz",relevancia:"alta",area:"trabalhista"},
      {titulo:"Assedio Moral no Trabalho: Como Provar e Recorrer",relevancia:"media",area:"trabalhista"},
      {titulo:"Seguro Desemprego: Quem Tem Direito e Como Solicitar",relevancia:"media",area:"cotidiano"},
      {titulo:"Rescisao Indireta: Quando o Empregado Pode Pedir Demissao",relevancia:"alta",area:"trabalhista"},
      {titulo:"FGTS: Quando e Como Sacar Seus Recursos",relevancia:"media",area:"cotidiano"},
      {titulo:"Revisao de Beneficio INSS: Quando Vale a Pena",relevancia:"media",area:"previdenciario"}
    ],geradoEm:new Date().toISOString(),fallback:true});
  }
});

app.listen(process.env.PORT||3000,()=>console.log("LexPost ready"));
