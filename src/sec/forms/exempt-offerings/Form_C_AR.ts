//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Form } from "../Form";

export class Form_C_AR extends Form {
  static readonly name = "Annual Report (Regulation Crowdfunding)";
  static readonly description = "Annual Report";
  static readonly forms = ["C-AR", "C-AR/A", "C-AR-W", "C-AR/A-W"] as const;
}
