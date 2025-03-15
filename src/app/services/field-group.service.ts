import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FieldGroup } from '../models/field-group.model';

@Injectable({
  providedIn: 'root'
})
export class FieldGroupService {
  private readonly STORAGE_KEY = 'form-builder-field-groups';
  private fieldGroupsSubject = new BehaviorSubject<FieldGroup[]>([]);
  private selectedGroupSubject = new BehaviorSubject<FieldGroup | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  get fieldGroups$(): Observable<FieldGroup[]> {
    return this.fieldGroupsSubject.asObservable();
  }

  get selectedGroup$(): Observable<FieldGroup | null> {
    return this.selectedGroupSubject.asObservable();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.fieldGroupsSubject.next(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading from storage:', e);
        localStorage.removeItem(this.STORAGE_KEY);
        this.fieldGroupsSubject.next([]);
      }
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.fieldGroupsSubject.value)
      );
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
  }

  createFieldGroup(group: Partial<FieldGroup>): void {
    // Ensure the group has a valid ID
    const newGroup: FieldGroup = {
      id: group.id || crypto.randomUUID(),
      name: group.name || 'New Group',
      description: group.description || '',
      elements: group.elements || []
    };
    
    const groups = [...this.fieldGroupsSubject.value, newGroup];
    this.fieldGroupsSubject.next(groups);
    this.saveToStorage();
    
    // Automatically select the new group
    this.selectGroup(newGroup);
    
    console.log('Group created:', newGroup);
    console.log('All groups:', groups);
  }

  updateFieldGroup(group: FieldGroup): void {
    if (!group || !group.id) {
      console.error('Cannot update group: Invalid group or missing ID', group);
      return;
    }
    
    // Create a deep copy to ensure we avoid reference issues
    const updatedGroup = JSON.parse(JSON.stringify(group));
    
    const groups = this.fieldGroupsSubject.value.map(g =>
      g.id === updatedGroup.id ? updatedGroup : g
    );
    
    this.fieldGroupsSubject.next(groups);
    
    // Update the selected group if it's the one being updated
    if (this.selectedGroupSubject.value?.id === updatedGroup.id) {
      this.selectedGroupSubject.next(updatedGroup);
    }
    
    this.saveToStorage();
    
    console.log('Group updated:', updatedGroup);
    console.log('All groups after update:', groups);
  }

  deleteFieldGroup(id: string): void {
    const groups = this.fieldGroupsSubject.value.filter(g => g.id !== id);
    this.fieldGroupsSubject.next(groups);
    if (this.selectedGroupSubject.value?.id === id) {
      this.selectedGroupSubject.next(null);
    }
    this.saveToStorage();
  }

  selectGroup(group: FieldGroup | null): void {
    // Make a defensive copy to avoid reference issues
    const groupCopy = group ? JSON.parse(JSON.stringify(group)) : null;
    this.selectedGroupSubject.next(groupCopy);
    console.log('Selected group:', groupCopy);
  }

  exportConfiguration(): string {
    return JSON.stringify(this.fieldGroupsSubject.value, null, 2);
  }

  importConfiguration(json: string): void {
    try {
      const groups = JSON.parse(json);
      this.fieldGroupsSubject.next(groups);
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to import configuration:', error);
      throw new Error('Invalid configuration format');
    }
  }
} 