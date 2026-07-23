async function main(){
  try{
    const url = 'http://localhost:3000/api/admin/approvals/requests'
    const res = await fetch(url)
    console.log('STATUS', res.status)
    console.log('HEADERS')
    for (const [k,v] of res.headers) console.log(k+':', v)
    const text = await res.text()
    console.log('\nBODY:\n', text)
  }catch(e){
    console.error('Fetch error', e)
    process.exit(1)
  }
}
main()
