
    MERGE (to1:VARIABLE { name: 'IAddable' })
    MERGE (from2:VARIABLE { name: 'nodeIdentifierIAddableType$8' })
    CREATE (from2)-[:EvaluatedFrom]->(to1)
  

    MERGE (to3:VARIABLE { name: 'Integer' })
    MERGE (from4:VARIABLE { name: 'nodeIdentifierIntegerType$9' })
    CREATE (from4)-[:EvaluatedFrom]->(to3)
  

    MERGE (to5:VARIABLE { name: 'integerIdentity' })
    MERGE (from6:VARIABLE { name: 'nodeIdentifierintegerIdentityType$10' })
    CREATE (from6)-[:EvaluatedFrom]->(to5)
  

    
      CREATE (midPoint7:VALUE { content: '{
  "body": {
    "name": "applicationResult$11",
    "kind": "FreeVariable"
  },
  "parameter": {
    "name": "nodeIdentifierIntegerType$9",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral"
}' })
      
      MERGE (nodeIdentifierIntegerType_98:VARIABLE { name: 'nodeIdentifierIntegerType$9' })
      CREATE (midPoint7)-[:CONTAINS]->(nodeIdentifierIntegerType_98)
    

      MERGE (applicationResult_119:VARIABLE { name: 'applicationResult$11' })
      CREATE (midPoint7)-[:CONTAINS]->(applicationResult_119)
    
    
    MERGE (from10:VARIABLE { name: 'nodeIdentifierIAddableType$8' })
    CREATE (from10)-[:EvaluatesTo]->(midPoint7)
  

    MERGE (to11:VARIABLE { name: 'applicationResult$11' })
    MERGE (from12:VARIABLE { name: 'nodeApplicationType$12' })
    CREATE (from12)-[:EvaluatedFrom]->(to11)
  

    
      CREATE (midPoint13:VALUE { content: '{
  "properties": {
    "go": {
      "name": "nodeIdentifierintegerIdentityType$10",
      "kind": "FreeVariable"
    }
  },
  "kind": "RecordLiteral"
}' })
      
      MERGE (nodeIdentifierintegerIdentityType_1014:VARIABLE { name: 'nodeIdentifierintegerIdentityType$10' })
      CREATE (midPoint13)-[:CONTAINS]->(nodeIdentifierintegerIdentityType_1014)
    
    
    MERGE (from15:VARIABLE { name: 'nodeRecordExpressionType$13' })
    CREATE (from15)-[:EvaluatedFrom]->(midPoint13)
  

    
      CREATE (midPoint16:VALUE { content: '{
  "body": {
    "name": "applicationResult$15",
    "kind": "FreeVariable"
  },
  "parameter": {
    "name": "nodeRecordExpressionType$13",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral"
}' })
      
      MERGE (nodeRecordExpressionType_1317:VARIABLE { name: 'nodeRecordExpressionType$13' })
      CREATE (midPoint16)-[:CONTAINS]->(nodeRecordExpressionType_1317)
    

      MERGE (applicationResult_1518:VARIABLE { name: 'applicationResult$15' })
      CREATE (midPoint16)-[:CONTAINS]->(applicationResult_1518)
    
    
    MERGE (from19:VARIABLE { name: 'nodeApplicationType$12' })
    CREATE (from19)-[:EvaluatesTo]->(midPoint16)
  

    MERGE (to20:VARIABLE { name: 'applicationResult$15' })
    MERGE (from21:VARIABLE { name: 'nodeApplicationType$16' })
    CREATE (from21)-[:Equals]->(to20)
  

    
      CREATE (midPoint22:VALUE { content: '{
  "value": 111111,
  "kind": "NumberLiteral"
}' })
      
    
    MERGE (from23:VARIABLE { name: 'nodeNumberExpressionType$14' })
    CREATE (from23)-[:EvaluatedFrom]->(midPoint22)
  

    MERGE (to24:VARIABLE { name: 'Integer' })
    MERGE (from25:VARIABLE { name: 'nodeIdentifierIntegerType$17' })
    CREATE (from25)-[:EvaluatedFrom]->(to24)
  

    MERGE (to26:VARIABLE { name: 'b$rename$7' })
    MERGE (from27:VARIABLE { name: 'nodeIdentifierb$rename$7Type$18' })
    CREATE (from27)-[:EvaluatedFrom]->(to26)
  

    MERGE (to28:VARIABLE { name: 'b$rename$7' })
    MERGE (from29:VARIABLE { name: 'nodeIdentifierb$rename$7Type$19' })
    CREATE (from29)-[:EvaluatedFrom]->(to28)
  

    MERGE (to30:VARIABLE { name: 'b$rename$7' })
    MERGE (from31:VARIABLE { name: 'nodeIdentifierb$rename$7Type$20' })
    CREATE (from31)-[:EvaluatedFrom]->(to30)
  

    
      CREATE (midPoint32:VALUE { content: '{
  "body": {
    "name": "applicationResult$21",
    "kind": "FreeVariable"
  },
  "parameter": {
    "name": "nodeIdentifierb$rename$7Type$18",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral"
}' })
      
      MERGE (nodeIdentifierb_rename_7Type_1833:VARIABLE { name: 'nodeIdentifierb$rename$7Type$18' })
      CREATE (midPoint32)-[:CONTAINS]->(nodeIdentifierb_rename_7Type_1833)
    

      MERGE (applicationResult_2134:VARIABLE { name: 'applicationResult$21' })
      CREATE (midPoint32)-[:CONTAINS]->(applicationResult_2134)
    
    
    MERGE (from35:VARIABLE { name: 'nodeIdentifierIntegerType$17' })
    CREATE (from35)-[:EvaluatesTo]->(midPoint32)
  

    MERGE (to36:VARIABLE { name: 'applicationResult$21' })
    MERGE (from37:VARIABLE { name: 'nodeApplicationType$22' })
    CREATE (from37)-[:EvaluatedFrom]->(to36)
  

    
      CREATE (midPoint38:VALUE { content: '{
  "body": {
    "name": "nodeIdentifierb$rename$7Type$20",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral",
  "parameter": {
    "name": "nodeIdentifierb$rename$7Type$19",
    "kind": "FreeVariable"
  }
}' })
      
      MERGE (nodeIdentifierb_rename_7Type_1939:VARIABLE { name: 'nodeIdentifierb$rename$7Type$19' })
      CREATE (midPoint38)-[:CONTAINS]->(nodeIdentifierb_rename_7Type_1939)
    

      MERGE (nodeIdentifierb_rename_7Type_2040:VARIABLE { name: 'nodeIdentifierb$rename$7Type$20' })
      CREATE (midPoint38)-[:CONTAINS]->(nodeIdentifierb_rename_7Type_2040)
    
    
    MERGE (from41:VARIABLE { name: 'nodeFunctionExpressionType$23' })
    CREATE (from41)-[:EvaluatedFrom]->(midPoint38)
  

    MERGE (to42:VARIABLE { name: 'implementation' })
    MERGE (from43:VARIABLE { name: 'nodeApplicationType$16' })
    CREATE (from43)-[:Equals]->(to42)
  

    
      CREATE (midPoint44:VALUE { content: '{
  "body": {
    "name": "nodeFunctionExpressionType$23",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral",
  "parameter": {
    "name": "nodeApplicationType$22",
    "kind": "FreeVariable"
  }
}' })
      
      MERGE (nodeApplicationType_2245:VARIABLE { name: 'nodeApplicationType$22' })
      CREATE (midPoint44)-[:CONTAINS]->(nodeApplicationType_2245)
    

      MERGE (nodeFunctionExpressionType_2346:VARIABLE { name: 'nodeFunctionExpressionType$23' })
      CREATE (midPoint44)-[:CONTAINS]->(nodeFunctionExpressionType_2346)
    
    
    MERGE (from47:VARIABLE { name: 'nodeFunctionExpressionType$25' })
    CREATE (from47)-[:Equals]->(midPoint44)
  

    MERGE (to48:VARIABLE { name: 'nodeNumberExpressionType$14' })
    MERGE (from49:VARIABLE { name: 'nodeBindingExpressionType$24' })
    CREATE (from49)-[:EvaluatedFrom]->(to48)
  

    MERGE (to50:VARIABLE { name: 'I$rename$3' })
    MERGE (from51:VARIABLE { name: 'nodeIdentifierI$rename$3Type$26' })
    CREATE (from51)-[:EvaluatedFrom]->(to50)
  

    MERGE (to52:VARIABLE { name: 'n$rename$4' })
    MERGE (from53:VARIABLE { name: 'nodeIdentifiern$rename$4Type$27' })
    CREATE (from53)-[:EvaluatedFrom]->(to52)
  

    MERGE (to54:VARIABLE { name: 'n$rename$4' })
    MERGE (from55:VARIABLE { name: 'nodeIdentifiern$rename$4Type$28' })
    CREATE (from55)-[:EvaluatedFrom]->(to54)
  

    MERGE (to56:VARIABLE { name: 'n$rename$4' })
    MERGE (from57:VARIABLE { name: 'nodeIdentifiern$rename$4Type$29' })
    CREATE (from57)-[:EvaluatedFrom]->(to56)
  

    
      CREATE (midPoint58:VALUE { content: '{
  "body": {
    "name": "applicationResult$30",
    "kind": "FreeVariable"
  },
  "parameter": {
    "name": "nodeIdentifiern$rename$4Type$27",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral"
}' })
      
      MERGE (nodeIdentifiern_rename_4Type_2759:VARIABLE { name: 'nodeIdentifiern$rename$4Type$27' })
      CREATE (midPoint58)-[:CONTAINS]->(nodeIdentifiern_rename_4Type_2759)
    

      MERGE (applicationResult_3060:VARIABLE { name: 'applicationResult$30' })
      CREATE (midPoint58)-[:CONTAINS]->(applicationResult_3060)
    
    
    MERGE (from61:VARIABLE { name: 'nodeIdentifierI$rename$3Type$26' })
    CREATE (from61)-[:EvaluatesTo]->(midPoint58)
  

    MERGE (to62:VARIABLE { name: 'applicationResult$30' })
    MERGE (from63:VARIABLE { name: 'nodeApplicationType$31' })
    CREATE (from63)-[:EvaluatedFrom]->(to62)
  

    
      CREATE (midPoint64:VALUE { content: '{
  "body": {
    "name": "nodeIdentifiern$rename$4Type$29",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral",
  "parameter": {
    "name": "nodeIdentifiern$rename$4Type$28",
    "kind": "FreeVariable"
  }
}' })
      
      MERGE (nodeIdentifiern_rename_4Type_2865:VARIABLE { name: 'nodeIdentifiern$rename$4Type$28' })
      CREATE (midPoint64)-[:CONTAINS]->(nodeIdentifiern_rename_4Type_2865)
    

      MERGE (nodeIdentifiern_rename_4Type_2966:VARIABLE { name: 'nodeIdentifiern$rename$4Type$29' })
      CREATE (midPoint64)-[:CONTAINS]->(nodeIdentifiern_rename_4Type_2966)
    
    
    MERGE (from67:VARIABLE { name: 'nodeFunctionExpressionType$32' })
    CREATE (from67)-[:EvaluatedFrom]->(midPoint64)
  

    
      CREATE (midPoint68:VALUE { content: '{
  "body": {
    "name": "nodeFunctionExpressionType$32",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral",
  "parameter": {
    "name": "nodeApplicationType$31",
    "kind": "FreeVariable"
  }
}' })
      
      MERGE (nodeApplicationType_3169:VARIABLE { name: 'nodeApplicationType$31' })
      CREATE (midPoint68)-[:CONTAINS]->(nodeApplicationType_3169)
    

      MERGE (nodeFunctionExpressionType_3270:VARIABLE { name: 'nodeFunctionExpressionType$32' })
      CREATE (midPoint68)-[:CONTAINS]->(nodeFunctionExpressionType_3270)
    
    
    MERGE (from71:VARIABLE { name: 'nodeFunctionExpressionType$33' })
    CREATE (from71)-[:EvaluatedFrom]->(midPoint68)
  

    
      CREATE (midPoint72:VALUE { content: '{
  "name": "IAddable",
  "kind": "SymbolLiteral"
}' })
      
    
    MERGE (from73:VARIABLE { name: 'nodeSymbolExpressionType$34' })
    CREATE (from73)-[:EvaluatedFrom]->(midPoint72)
  

    MERGE (to74:VARIABLE { name: 'I$rename$5' })
    MERGE (from75:VARIABLE { name: 'nodeIdentifierI$rename$5Type$35' })
    CREATE (from75)-[:EvaluatedFrom]->(to74)
  

    MERGE (to76:VARIABLE { name: 'methods$rename$6' })
    MERGE (from77:VARIABLE { name: 'nodeIdentifiermethods$rename$6Type$36' })
    CREATE (from77)-[:EvaluatedFrom]->(to76)
  

    
      CREATE (midPoint78:VALUE { content: '{
  "properties": {
    "go": {
      "name": "nodeFunctionExpressionType$33",
      "kind": "FreeVariable"
    }
  },
  "kind": "RecordLiteral"
}' })
      
      MERGE (nodeFunctionExpressionType_3379:VARIABLE { name: 'nodeFunctionExpressionType$33' })
      CREATE (midPoint78)-[:CONTAINS]->(nodeFunctionExpressionType_3379)
    
    
    MERGE (from80:VARIABLE { name: 'nodeRecordExpressionType$37' })
    CREATE (from80)-[:EvaluatedFrom]->(midPoint78)
  

    
      CREATE (midPoint81:VALUE { content: '{
  "parameters": [
    {
      "name": "nodeIdentifierI$rename$5Type$35",
      "kind": "FreeVariable"
    },
    {
      "name": "nodeIdentifiermethods$rename$6Type$36",
      "kind": "FreeVariable"
    }
  ],
  "name": {
    "name": "nodeSymbolExpressionType$34",
    "kind": "FreeVariable"
  },
  "kind": "DataValue"
}' })
      
      MERGE (nodeIdentifierI_rename_5Type_3582:VARIABLE { name: 'nodeIdentifierI$rename$5Type$35' })
      CREATE (midPoint81)-[:CONTAINS]->(nodeIdentifierI_rename_5Type_3582)
    

      MERGE (nodeIdentifiermethods_rename_6Type_3683:VARIABLE { name: 'nodeIdentifiermethods$rename$6Type$36' })
      CREATE (midPoint81)-[:CONTAINS]->(nodeIdentifiermethods_rename_6Type_3683)
    

      MERGE (nodeSymbolExpressionType_3484:VARIABLE { name: 'nodeSymbolExpressionType$34' })
      CREATE (midPoint81)-[:CONTAINS]->(nodeSymbolExpressionType_3484)
    
    
    MERGE (from85:VARIABLE { name: 'nodeDataInstantiationType$38' })
    CREATE (from85)-[:EvaluatedFrom]->(midPoint81)
  

    MERGE (to86:VARIABLE { name: 'x$rename$2' })
    MERGE (from87:VARIABLE { name: 'nodeIdentifierx$rename$2Type$39' })
    CREATE (from87)-[:EvaluatedFrom]->(to86)
  

    
      CREATE (midPoint88:VALUE { content: '{
  "body": {
    "name": "nodeDataInstantiationType$38",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral",
  "parameter": {
    "name": "nodeRecordExpressionType$37",
    "kind": "FreeVariable"
  }
}' })
      
      MERGE (nodeRecordExpressionType_3789:VARIABLE { name: 'nodeRecordExpressionType$37' })
      CREATE (midPoint88)-[:CONTAINS]->(nodeRecordExpressionType_3789)
    

      MERGE (nodeDataInstantiationType_3890:VARIABLE { name: 'nodeDataInstantiationType$38' })
      CREATE (midPoint88)-[:CONTAINS]->(nodeDataInstantiationType_3890)
    
    
    MERGE (from91:VARIABLE { name: 'nodeFunctionExpressionType$40' })
    CREATE (from91)-[:EvaluatedFrom]->(midPoint88)
  

    MERGE (to92:VARIABLE { name: 'integerIdentity' })
    MERGE (from93:VARIABLE { name: 'nodeFunctionExpressionType$25' })
    CREATE (from93)-[:Equals]->(to92)
  

    
      CREATE (midPoint94:VALUE { content: '{
  "body": {
    "name": "nodeFunctionExpressionType$40",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral",
  "parameter": {
    "name": "nodeIdentifierx$rename$2Type$39",
    "kind": "FreeVariable"
  }
}' })
      
      MERGE (nodeIdentifierx_rename_2Type_3995:VARIABLE { name: 'nodeIdentifierx$rename$2Type$39' })
      CREATE (midPoint94)-[:CONTAINS]->(nodeIdentifierx_rename_2Type_3995)
    

      MERGE (nodeFunctionExpressionType_4096:VARIABLE { name: 'nodeFunctionExpressionType$40' })
      CREATE (midPoint94)-[:CONTAINS]->(nodeFunctionExpressionType_4096)
    
    
    MERGE (from97:VARIABLE { name: 'nodeFunctionExpressionType$42' })
    CREATE (from97)-[:Equals]->(midPoint94)
  

    MERGE (to98:VARIABLE { name: 'nodeBindingExpressionType$24' })
    MERGE (from99:VARIABLE { name: 'nodeBindingExpressionType$41' })
    CREATE (from99)-[:EvaluatedFrom]->(to98)
  

    
      CREATE (midPoint100:VALUE { content: '{
  "name": "Integer",
  "kind": "SymbolLiteral"
}' })
      
    
    MERGE (from101:VARIABLE { name: 'nodeSymbolExpressionType$43' })
    CREATE (from101)-[:EvaluatedFrom]->(midPoint100)
  

    MERGE (to102:VARIABLE { name: 'a$rename$1' })
    MERGE (from103:VARIABLE { name: 'nodeIdentifiera$rename$1Type$44' })
    CREATE (from103)-[:EvaluatedFrom]->(to102)
  

    MERGE (to104:VARIABLE { name: 'a$rename$1' })
    MERGE (from105:VARIABLE { name: 'nodeIdentifiera$rename$1Type$45' })
    CREATE (from105)-[:EvaluatedFrom]->(to104)
  

    
      CREATE (midPoint106:VALUE { content: '{
  "parameters": [
    {
      "name": "nodeIdentifiera$rename$1Type$44",
      "kind": "FreeVariable"
    }
  ],
  "name": {
    "name": "nodeSymbolExpressionType$43",
    "kind": "FreeVariable"
  },
  "kind": "DataValue"
}' })
      
      MERGE (nodeIdentifiera_rename_1Type_44107:VARIABLE { name: 'nodeIdentifiera$rename$1Type$44' })
      CREATE (midPoint106)-[:CONTAINS]->(nodeIdentifiera_rename_1Type_44107)
    

      MERGE (nodeSymbolExpressionType_43108:VARIABLE { name: 'nodeSymbolExpressionType$43' })
      CREATE (midPoint106)-[:CONTAINS]->(nodeSymbolExpressionType_43108)
    
    
    MERGE (from109:VARIABLE { name: 'nodeDataInstantiationType$46' })
    CREATE (from109)-[:EvaluatedFrom]->(midPoint106)
  

    MERGE (to110:VARIABLE { name: 'IAddable' })
    MERGE (from111:VARIABLE { name: 'nodeFunctionExpressionType$42' })
    CREATE (from111)-[:Equals]->(to110)
  

    
      CREATE (midPoint112:VALUE { content: '{
  "body": {
    "name": "nodeDataInstantiationType$46",
    "kind": "FreeVariable"
  },
  "kind": "FunctionLiteral",
  "parameter": {
    "name": "nodeIdentifiera$rename$1Type$45",
    "kind": "FreeVariable"
  }
}' })
      
      MERGE (nodeIdentifiera_rename_1Type_45113:VARIABLE { name: 'nodeIdentifiera$rename$1Type$45' })
      CREATE (midPoint112)-[:CONTAINS]->(nodeIdentifiera_rename_1Type_45113)
    

      MERGE (nodeDataInstantiationType_46114:VARIABLE { name: 'nodeDataInstantiationType$46' })
      CREATE (midPoint112)-[:CONTAINS]->(nodeDataInstantiationType_46114)
    
    
    MERGE (from115:VARIABLE { name: 'nodeFunctionExpressionType$48' })
    CREATE (from115)-[:Equals]->(midPoint112)
  

    MERGE (to116:VARIABLE { name: 'nodeBindingExpressionType$41' })
    MERGE (from117:VARIABLE { name: 'nodeBindingExpressionType$47' })
    CREATE (from117)-[:EvaluatedFrom]->(to116)
  

    MERGE (to118:VARIABLE { name: 'Integer' })
    MERGE (from119:VARIABLE { name: 'nodeFunctionExpressionType$48' })
    CREATE (from119)-[:Equals]->(to118)
  

    MERGE (to120:VARIABLE { name: 'nodeBindingExpressionType$47' })
    MERGE (from121:VARIABLE { name: 'nodeBindingExpressionType$49' })
    CREATE (from121)-[:EvaluatedFrom]->(to120)
  
