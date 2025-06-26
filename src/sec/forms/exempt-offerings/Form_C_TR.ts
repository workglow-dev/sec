//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_C_TR extends Form {
  static readonly name = "Termination of Reporting (Regulation Crowdfunding)";
  static readonly description = "Termination of Reporting";
  static readonly forms = ["C-TR", "C-TR-W"] as const;
}
