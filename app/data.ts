const facilitiesData = [
  {
    "id": "1",
    "externalId": "1296",
    "name": "RRVW Casselton Transload",
    "type": "TRANSLOAD",
    "status": "ACTIVE",
    "description": "RRVW Casselton Transload is a transloading company in Casselton, ND",
    "phone": "+12186434994",
    "website": "https://www.commtrex.com/transloading/location/1296.html",
    "location": {
      "streetAddress": "1630 1st Ave S",
      "city": "Casselton",
      "state": "ND",
      "zipCode": "58012",
      "country": "US"
    },
    "capabilities": {
      "trackCapacity": 25,
      "hazmatCertified": false,
      "foodGrade": false,
      "hasScale": true,
      "hasRailcarStorage": false,
      "is247": false,
      "productTypes": ["Dry Bulk", "Liquids"]
    },
    "railroads": [{"railroad": {"name": "BNSF"}}],
    "categories": [{"category": {"name": "Dry Bulk"}}, {"category": {"name": "Liquids"}}]
  },
  {
    "id": "2",
    "externalId": "2739",
    "name": "South Shore Transload",
    "type": "TRANSLOAD",
    "status": "ACTIVE",
    "phone": "+12192144294",
    "website": "https://www.commtrex.com/transloading/location/2739.html",
    "location": {
      "streetAddress": "800 Lumber Center Drive",
      "city": "Michigan City",
      "state": "IN",
      "zipCode": "46360",
      "country": "US"
    },
    "capabilities": {
      "trackCapacity": 10,
      "hazmatCertified": false,
      "foodGrade": false,
      "hasScale": true,
      "hasRailcarStorage": false
    },
    "railroads": [{"railroad": {"name": "BNSF"}}, {"railroad": {"name": "CN"}}, {"railroad": {"name": "CSX"}}],
    "categories": [{"category": {"name": "Dry Bulk"}}]
  },
  {
    "id": "3",
    "externalId": "1336",
    "name": "Mansfield Railport",
    "type": "TRANSLOAD",
    "status": "ACTIVE",
    "phone": "+12159624866",
    "website": "https://www.commtrex.com/transloading/location/1336.html",
    "location": {
      "streetAddress": "1427 Sprang Parkway",
      "city": "Mansfield",
      "state": "OH",
      "zipCode": "44903",
      "country": "US"
    },
    "capabilities": {
      "trackCapacity": 19,
      "hazmatCertified": false,
      "foodGrade": false,
      "hasScale": true,
      "hasRailcarStorage": true
    },
    "railroads": [{"railroad": {"name": "CSX"}}, {"railroad": {"name": "NS"}}]
  },
  {
    "id": "4",
    "externalId": "1235",
    "name": "Pegasus National, Inc.",
    "type": "TRANSLOAD",
    "status": "ACTIVE",
    "phone": "+12059078007",
    "location": {
      "city": "Birmingham",
      "state": "AL",
      "zipCode": "35234"
    },
    "capabilities": {
      "trackCapacity": 160,
      "hazmatCertified": true,
      "foodGrade": true,
      "hasScale": true,
      "hasRailcarStorage": true
    }
  },
  {
    "id": "5",
    "externalId": "1075",
    "name": "Bakersfield QDC",
    "type": "TRANSLOAD",
    "status": "ACTIVE",
    "phone": "+16615888203",
    "location": {
      "city": "Bakersfield",
      "state": "CA",
      "zipCode": "93314"
    },
    "capabilities": {
      "trackCapacity": 60,
      "hazmatCertified": false,
      "foodGrade": false,
      "hasScale": true
    }
  }
] as any[]

export default facilitiesData