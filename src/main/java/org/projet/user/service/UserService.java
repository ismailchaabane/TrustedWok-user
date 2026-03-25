package org.projet.user.service;

import org.projet.user.entity.User;

import java.util.List;

public abstract interface UserService {

    public void addUser(User user);
    public void updateUser(User user);
    public boolean deleteUser(Long id);
    public User getUserById(Long id);
    public List<User> getAllUsers();
}
