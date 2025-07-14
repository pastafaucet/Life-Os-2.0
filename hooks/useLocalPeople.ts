import { useState, useEffect } from 'react';
import { Person } from '@/lib/storage/types';
import { LocalStorage } from '@/lib/storage/localStorage';

export function useLocalPeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LocalStorage.initialize();
    const loadedPeople = LocalStorage.getPeople();
    setPeople(loadedPeople);
    setLoading(false);
  }, []);

  const createPerson = (personData: Partial<Person>) => {
    const newPerson = LocalStorage.createPerson(personData);
    setPeople(LocalStorage.getPeople()); // Refresh from storage
    return newPerson;
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    const updatedPerson = LocalStorage.updatePerson(id, updates);
    if (updatedPerson) {
      setPeople(LocalStorage.getPeople()); // Refresh from storage
    }
    return updatedPerson;
  };

  const searchPeople = (query: string): Person[] => {
    return LocalStorage.searchPeople(query);
  };

  const getPersonByName = (name: string): Person | undefined => {
    return people.find((p: Person) => p.name.toLowerCase().includes(name.toLowerCase()));
  };

  const getPeopleByRole = (role: string) => {
    return people.filter((p: Person) => p.role.toLowerCase().includes(role.toLowerCase()));
  };

  return {
    people,
    loading,
    createPerson,
    updatePerson,
    searchPeople,
    getPersonByName,
    getPeopleByRole
  };
}
