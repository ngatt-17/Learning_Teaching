"""
Mock database and materials for CECS AI Learning Hub - Course CS101.
Used for Day 02 AI & Quality development and integration tests.
"""

# Approved course materials
MOCK_MATERIALS = [
    {
        "id": "mat_01",
        "course_id": "CS101",
        "lesson_id": "lec_01",
        "source_file": "Lecture01_Intro.pdf",
        "title": "Introduction to C Programming & Primitive Data Types",
        "status": "approved",  # APPROVED material
        "pages": [
            {
                "page": 1,
                "content": "Course CS101: Introduction to Programming. Welcome to VinUniversity CECS. Instructor: Prof. Nguyen."
            },
            {
                "page": 5,
                "content": "Primitive Data Types in C on standard 64-bit systems: char is 1 byte (-128 to 127). int is 4 bytes (32-bit signed integer). float is 4 bytes (IEEE 754 single precision). double is 8 bytes. Pointers are 8 bytes on 64-bit architecture."
            },
            {
                "page": 8,
                "content": "Variable declaration and initialization syntax in C: type variable_name = value; Example: int count = 10; char grade = 'A';"
            }
        ]
    },
    {
        "id": "mat_02",
        "course_id": "CS101",
        "lesson_id": "lec_02",
        "source_file": "Lecture02_Pointers.pdf",
        "title": "Pointers and Dynamic Memory Allocation",
        "status": "approved",  # APPROVED material
        "pages": [
            {
                "page": 12,
                "content": "Pointer basics: A pointer is a variable that stores the memory address of another variable. The address-of operator '&' retrieves the address. The dereference operator '*' (indirection) accesses or modifies the value stored at the address pointed to by the pointer."
            },
            {
                "page": 15,
                "content": "Pointer size: On modern 64-bit computing architectures, all pointer types (int*, char*, void*, etc.) have a size of 8 bytes because memory addresses are 64 bits wide."
            },
            {
                "page": 18,
                "content": "Dynamic Memory Allocation functions in <stdlib.h>: malloc(size_t size) allocates uninitialized bytes on the heap. calloc(size_t num, size_t size) allocates memory initialized to zero. realloc(void* ptr, size_t new_size) resizes previously allocated memory. free(void* ptr) releases allocated memory back to the operating system."
            }
        ]
    },
    {
        "id": "mat_03_draft",
        "course_id": "CS101",
        "lesson_id": "lec_03",
        "source_file": "Lecture03_Draft_Structs.pdf",
        "title": "Structures and Unions (DRAFT - NOT APPROVED YET)",
        "status": "draft",  # DRAFT material - MUST BE EXCLUDED from student retrieval!
        "pages": [
            {
                "page": 1,
                "content": "C Structures (struct): Allows grouping variables of different data types together under a single name."
            }
        ]
    },
    {
        "id": "mat_other_course",
        "course_id": "EE201",
        "lesson_id": "lec_01",
        "source_file": "Circuit_Analysis.pdf",
        "title": "Ohm's Law and Kirchhoff's Laws",
        "status": "approved",  # Belongs to another course - MUST BE EXCLUDED!
        "pages": [
            {
                "page": 1,
                "content": "Ohm's law states that V = I * R, where V is voltage, I is current, and R is resistance."
            }
        ]
    }
]

# Topic mappings for review recommendations
TOPIC_REVIEW_MAP = {
    "Pointers": {"source_file": "Lecture02_Pointers.pdf", "pages": "12-18"},
    "Con trỏ & Quản lý bộ nhớ": {"source_file": "Lecture02_Pointers.pdf", "pages": "12-18"},
    "Memory Management": {"source_file": "Lecture02_Pointers.pdf", "pages": "18"},
    "Kiểu dữ liệu cơ bản": {"source_file": "Lecture01_Intro.pdf", "pages": "5"},
    "Cú pháp & Kiểu dữ liệu cơ bản": {"source_file": "Lecture01_Intro.pdf", "pages": "5-8"},
}
