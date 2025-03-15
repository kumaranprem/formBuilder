export interface FieldGroup {
  id: string;
  name: string;
  description: string;
  elements: FormElement[];
}

export interface FormElement {
  id: string;
  type: FormElementType;
  name: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: any;
  fileTypes?: string;
  validations?: {
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  category?: ElementCategory;
}

export enum FormElementType {
  // Text inputs
  Text = 'Text',
  Number = 'Number',
  Email = 'Email',
  TextArea = 'TextArea',
  
  // Selection inputs
  Checkbox = 'Checkbox',
  Select = 'Select',
  Radio = 'Radio',
  
  // Date and time inputs
  Date = 'Date',
  Time = 'Time',
  DateTime = 'DateTime',
  
  // File inputs
  Upload = 'Upload'
}

export enum ElementCategory {
  Text = 'Text Inputs',
  Selection = 'Selection Inputs',
  DateTime = 'Date & Time',
  Files = 'File Uploads',
  Advanced = 'Advanced'
}

export const ELEMENT_CATEGORIES = {
  [ElementCategory.Text]: [
    FormElementType.Text,
    FormElementType.Number,
    FormElementType.Email,
    FormElementType.TextArea
  ],
  [ElementCategory.Selection]: [
    FormElementType.Checkbox,
    FormElementType.Select,
    FormElementType.Radio
  ],
  [ElementCategory.DateTime]: [
    FormElementType.Date,
    FormElementType.Time,
    FormElementType.DateTime
  ],
  [ElementCategory.Files]: [
    FormElementType.Upload
  ]
} 