# Cloudflare Subdomain Setup

Target subdomain:

```txt
eimnc2.tabunocnatlhs.com
```

## Steps

1. Log in to Cloudflare.
2. Select `tabunocnatlhs.com`.
3. Go to DNS → Records.
4. Add record.
5. Use the record provided by Vercel.

Most Vercel subdomain setups use:

```txt
Type: CNAME
Name: eimnc2
Target: cname.vercel-dns.com
Proxy status: DNS only
TTL: Auto
```

## Important notes

- Do not create this subdomain inside Squarespace if Cloudflare is the active DNS manager.
- If the orange cloud causes verification issues, set it to DNS only first.
- After Vercel verifies the domain, SSL/HTTPS will be issued automatically.
- If Vercel gives a different target, follow Vercel, not this sample.
